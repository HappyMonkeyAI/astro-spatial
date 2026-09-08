import type { SceneEditor } from './index.js'

export interface SceneEditorUiOptions { readonly onChange?: (manifest: ReturnType<SceneEditor['getManifest']>) => void }

export function mountSceneEditor(host: HTMLElement, editor: SceneEditor, options: SceneEditorUiOptions = {}): () => void {
  const panel = document.createElement('section')
  panel.className = 'astro-spatial-editor'
  panel.setAttribute('aria-label', 'Spatial scene editor')
  panel.style.cssText = 'display:grid;gap:.75rem;padding:1rem;background:#111827;color:#e5e7eb;font:14px system-ui;border:1px solid #374151;border-radius:.75rem;'
  const title = document.createElement('strong'); title.textContent = 'Scene editor'; panel.append(title)
  const select = document.createElement('select'); select.setAttribute('aria-label', 'Scene node')
  const controls = document.createElement('div'); controls.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;'
  const inputs = [0, 1, 2].map((index) => { const input = document.createElement('input'); input.type = 'number'; input.step = '0.1'; input.setAttribute('aria-label', `Position ${index + 1}`); controls.append(input); return input })
  const actions = document.createElement('div'); actions.style.cssText = 'display:flex;gap:.5rem;'
  const apply = document.createElement('button'); apply.textContent = 'Apply transform'
  const undo = document.createElement('button'); undo.textContent = 'Undo'
  const redo = document.createElement('button'); redo.textContent = 'Redo'
  actions.append(apply, undo, redo); panel.append(select, controls, actions); host.append(panel)

  const refreshNodes = () => {
    const selected = editor.getSelection().nodeId
    select.replaceChildren()
    for (const node of editor.getManifest().nodes) { const option = document.createElement('option'); option.value = node.id; option.textContent = node.id; option.selected = node.id === selected; select.append(option) }
  }
  const refreshInputs = () => {
    const id = select.value; if (!id) return
    editor.select(id)
    const node = editor.getManifest().nodes.find((item) => item.id === id) as ({ position?: readonly number[] } | undefined)
    const position = node?.position ?? [0, 0, 0]
    inputs.forEach((input, index) => { input.value = String(position[index] ?? 0) })
  }
  const notify = () => options.onChange?.(editor.getManifest())
  select.addEventListener('change', refreshInputs)
  apply.addEventListener('click', () => { if (select.value) { editor.setTransform(select.value, { position: inputs.map((input) => Number(input.value) || 0) as [number, number, number] }); notify(); refreshInputs() } })
  undo.addEventListener('click', () => { if (editor.undo()) { notify(); refreshNodes(); refreshInputs() } })
  redo.addEventListener('click', () => { if (editor.redo()) { notify(); refreshNodes(); refreshInputs() } })
  refreshNodes(); if (select.value) editor.select(select.value); refreshInputs()
  return () => { select.removeEventListener('change', refreshInputs); apply.remove(); undo.remove(); redo.remove(); panel.remove() }
}

export async function mountSceneEditorPreview(host: HTMLElement, canvas: HTMLCanvasElement, editor: SceneEditor): Promise<() => void> {
  const [{ createSpatialRenderer }, { TransformControls }] = await Promise.all([
    import('@astro-spatial/three'),
    import('three/addons/controls/TransformControls.js'),
  ])
  const renderer = createSpatialRenderer(canvas, { quality: 'low', adaptiveQuality: true })
  await renderer.render(editor.getManifest())
  const controls = new TransformControls(renderer.getCamera(), canvas)
  const helper = controls.getHelper()
  renderer.getScene().add(helper)
  const panelCleanup = mountSceneEditor(host, editor, { onChange: (manifest) => {
    void renderer.render(manifest).then(() => {
      controls.detach()
      const selectedObject = editor.getSelection().nodeId ? renderer.getObject(editor.getSelection().nodeId!) : undefined
      if (selectedObject) controls.attach(selectedObject)
    })
  } })
  const selectedId = editor.getSelection().nodeId
  const selectedObject = selectedId ? renderer.getObject(selectedId) : undefined
  if (selectedObject) controls.attach(selectedObject)
  const handleObjectChange = () => {
    const object = controls.object
    if (!object || !selectedId) return
    editor.setTransform(selectedId, { position: [object.position.x, object.position.y, object.position.z] })
  }
  controls.addEventListener('objectChange', handleObjectChange)
  const resize = () => renderer.resize(canvas.clientWidth, canvas.clientHeight)
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize()
  return () => { observer.disconnect(); controls.removeEventListener('objectChange', handleObjectChange); controls.detach(); renderer.getScene().remove(helper); controls.dispose(); panelCleanup(); renderer.dispose() }
}

// Real face detection using face-api.js (TensorFlow.js backend)
// Models served from /models/

let ready = false; let loading: Promise<boolean> | null = null
const MODEL = "/models"

export async function loadModels(): Promise<boolean> {
  if (ready) return true
  if (loading) return loading
  loading = (async () => {
    try {
      const api = await import("face-api.js")
      await Promise.all([api.nets.tinyFaceDetector.loadFromUri(MODEL), api.nets.faceLandmark68Net.loadFromUri(MODEL), api.nets.faceRecognitionNet.loadFromUri(MODEL)])
      ready = true; return true
    } catch { return false }
  })()
  return loading
}

export interface FaceData { box: {x:number;y:number;w:number;h:number;score:number}; desc: Float32Array; landmarks: {x:number;y:number}[] }

export async function detectFaces(input: HTMLImageElement): Promise<FaceData[]> {
  if (!(await loadModels())) throw new Error("Models failed to load")
  const api = await import("face-api.js")
  const opts = new (api as any).TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
  const r = await api.detectAllFaces(input as any, opts).withFaceLandmarks().withFaceDescriptors()
  return r.map((d: any) => ({ box: { x: d.detection.box.x, y: d.detection.box.y, w: d.detection.box.width, h: d.detection.box.height, score: Math.round(d.detection.score * 100) }, desc: d.descriptor, landmarks: (d.landmarks?.positions || []).map((p: any) => ({ x: p.x, y: p.y })) }))
}

export function compareDescriptors(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0
  let dot = 0, n1 = 0, n2 = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; n1 += a[i] * a[i]; n2 += b[i] * b[i] }
  return Math.round(((dot / (Math.sqrt(n1) * Math.sqrt(n2))) + 1) / 2 * 100)
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const img = new Image(); img.crossOrigin = "anonymous"; img.onload = () => resolve(img); img.onerror = reject; img.src = url })
}

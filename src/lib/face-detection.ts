// Real face detection + face recognition using face-api.js

let ready = false
let loading: Promise<boolean> | null = null
const MODEL_URL = "/models"

export async function loadModels(): Promise<boolean> {
  if (ready) return true
  if (loading) return loading
  loading = (async () => {
    try {
      const api = await import("face-api.js")
      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
      ready = true; return true
    } catch { return false }
  })()
  return loading
}

export interface FaceBox { x: number; y: number; width: number; height: number; score: number }
export interface FaceResult {
  box: FaceBox
  descriptor: Float32Array
  landmarks: Array<{ x: number; y: number }>
  age?: number; gender?: string; expression?: string
}

export async function detectFaces(input: HTMLImageElement | HTMLVideoElement): Promise<FaceResult[]> {
  const ok = await loadModels()
  if (!ok) throw new Error("Models not loaded")
  const api = await import("face-api.js")
  const opts = new (api as any).TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
  const r = await api.detectAllFaces(input as any, opts).withFaceLandmarks().withFaceDescriptors()
  return r.map((d: any) => ({
    box: { x: d.detection.box.x, y: d.detection.box.y, width: d.detection.box.width, height: d.detection.box.height, score: Math.round(d.detection.score * 100) },
    descriptor: d.descriptor,
    landmarks: (d.landmarks?.positions || []).map((p: any) => ({ x: p.x, y: p.y })),
  }))
}

export function compareDescriptors(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return 0
  let dot = 0, n1 = 0, n2 = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; n1 += a[i] * a[i]; n2 += b[i] * b[i] }
  return Math.round(((dot / (Math.sqrt(n1) * Math.sqrt(n2))) + 1) / 2 * 100)
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = "anonymous"
    img.onload = () => resolve(img); img.onerror = reject; img.src = url
  })
}

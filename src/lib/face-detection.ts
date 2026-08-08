// Real face detection using face-api.js
// Models loaded from /models/ directory

let modelsLoaded = false
let loadingPromise: Promise<boolean> | null = null

const MODEL_URL = "/models"

export async function loadModels(): Promise<boolean> {
  if (modelsLoaded) return true
  if (loadingPromise) {
    await loadingPromise
    return modelsLoaded
  }

  loadingPromise = (async () => {
    try {
      const faceapi = await import("face-api.js")
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ])
      modelsLoaded = true
      return true
    } catch (err) {
      console.error("Failed to load models:", err)
      return false
    }
  })()

  await loadingPromise
  return modelsLoaded
}

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
  score: number
}

export interface FaceLandmark {
  x: number
  y: number
}

export interface DetectedFace {
  box: FaceBox
  landmarks: FaceLandmark[]
  age?: number
  gender?: string
  genderProbability?: number
  expression?: string
  expressionProbability?: number
  descriptor?: Float32Array
}

export async function detectFaces(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<DetectedFace[]> {
  const loaded = await loadModels()
  if (!loaded) throw new Error("Face detection models not loaded")

  const faceapi = await import("face-api.js")

  const result = await faceapi
    .detectAllFaces(input as any, new (faceapi as any).TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withAgeAndGender()
    .withFaceExpressions()

  return result.map((d: any) => {
    const expressions = d.expressions || {}
    const topExpression = Object.entries(expressions).sort(([, a]: any, [, b]: any) => b - a)[0] as any

    return {
      box: {
        x: d.detection.box.x,
        y: d.detection.box.y,
        width: d.detection.box.width,
        height: d.detection.box.height,
        score: Math.round(d.detection.score * 100),
      },
      landmarks: (d.landmarks?.positions || []).map((p: any) => ({ x: p.x, y: p.y })),
      age: Math.round(d.age || 0),
      gender: d.gender || "unknown",
      genderProbability: Math.round((d.genderProbability || 0) * 100),
      expression: topExpression?.[0] || "neutral",
      expressionProbability: Math.round(((topExpression?.[1] as number) || 0) * 100),
      descriptor: d.descriptor,
    }
  })
}

export function drawFaceBoxes(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  faces: DetectedFace[]
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  // Draw image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

  const scaleX = canvas.width / image.width
  const scaleY = canvas.height / image.height

  faces.forEach((face) => {
    const { x, y, width, height } = face.box
    const sx = x * scaleX
    const sy = y * scaleY
    const sw = width * scaleX
    const sh = height * scaleY

    // Glow effect
    ctx.shadowColor = "rgba(59, 130, 246, 0.6)"
    ctx.shadowBlur = 15

    // Box
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.strokeRect(sx, sy, sw, sh)

    // Corner accents
    ctx.shadowBlur = 0
    const cornerLen = Math.min(sw, sh) * 0.2
    ctx.strokeStyle = "#60a5fa"
    ctx.lineWidth = 3

    // Top-left
    ctx.beginPath()
    ctx.moveTo(sx, sy + cornerLen)
    ctx.lineTo(sx, sy)
    ctx.lineTo(sx + cornerLen, sy)
    ctx.stroke()

    // Top-right
    ctx.beginPath()
    ctx.moveTo(sx + sw - cornerLen, sy)
    ctx.lineTo(sx + sw, sy)
    ctx.lineTo(sx + sw, sy + cornerLen)
    ctx.stroke()

    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(sx, sy + sh - cornerLen)
    ctx.lineTo(sx, sy + sh)
    ctx.lineTo(sx + cornerLen, sy + sh)
    ctx.stroke()

    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(sx + sw - cornerLen, sy + sh)
    ctx.lineTo(sx + sw, sy + sh)
    ctx.lineTo(sx + sw, sy + sh - cornerLen)
    ctx.stroke()

    // Label background
    const label = `Face · ${face.box.score}% · ${face.gender} · ~${face.age}y`
    ctx.font = "bold 13px Inter, system-ui, sans-serif"
    const labelW = ctx.measureText(label).width + 16

    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
    ctx.beginPath()
    ctx.roundRect(sx, sy - 32, labelW, 26, 8)
    ctx.fill()

    // Label text
    ctx.fillStyle = "#fff"
    ctx.fillText(label, sx + 8, sy - 14)

    // Draw landmarks
    ctx.fillStyle = "#60a5fa"
    face.landmarks.forEach((lm) => {
      ctx.beginPath()
      ctx.arc(lm.x * scaleX, lm.y * scaleY, 1.5, 0, Math.PI * 2)
      ctx.fill()
    })
  })
}

export function compareDescriptors(
  desc1: Float32Array,
  desc2: Float32Array
): number {
  if (desc1.length !== desc2.length) return 0
  let dot = 0
  let n1 = 0
  let n2 = 0
  for (let i = 0; i < desc1.length; i++) {
    dot += desc1[i] * desc2[i]
    n1 += desc1[i] * desc1[i]
    n2 += desc2[i] * desc2[i]
  }
  const sim = dot / (Math.sqrt(n1) * Math.sqrt(n2))
  return Math.round(((sim + 1) / 2) * 100)
}

export function imageUrlToElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = url
  })
}

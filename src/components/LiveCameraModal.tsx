import React, { useState, useEffect, useRef } from 'react'
import {
  Camera,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Check,
  Video,
} from 'lucide-react'
import { useT } from '../lib/i18n'

interface LiveCameraModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (dataUrl: string) => void
}

export function LiveCameraModal({ isOpen, onClose, onCapture }: LiveCameraModalProps) {
  const { tr, lang } = useT()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  // Start camera stream when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera()
      return
    }

    startCamera(facingMode)

    // Check device cameras
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput')
        setHasMultipleCameras(videoInputs.length > 1)
      }).catch(() => {})
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, facingMode])

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  async function startCamera(mode: 'environment' | 'user') {
    setErrorMsg(null)
    stopCamera()

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Live camera API is not supported in this browser environment. Please upload from files.')
        return
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(() => {})
      }
    } catch (err: any) {
      console.warn('Camera access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission denied. Please allow camera permissions in browser settings or choose an image file.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera hardware found on this device. Please select an image file from storage.')
      } else {
        setErrorMsg('Unable to access live video feed. You can still select or upload a sample image file.')
      }
    }
  }

  function handleFlipCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  function handleTakeSnapshot() {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video stream
    const width = video.videoWidth || 640
    const height = video.videoHeight || 480
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // If user camera, mirror it horizontally
      if (facingMode === 'user') {
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(video, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88)

      // Clean up and emit captured image
      stopCamera()
      setIsCapturing(false)
      onCapture(dataUrl)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111f19] border border-[#234235] shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#234235] flex items-center justify-between bg-[#172c23]/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#dff47d] text-[#173f32] grid place-items-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold text-white">
                {tr('Live Camera Viewfinder')}
              </h3>
              <p className="text-[10px] text-[#a4c2b2] font-semibold">
                {tr('Point camera at waste items for category assistance')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white grid place-items-center transition"
          >
            <X size={17} />
          </button>
        </div>

        {/* Viewfinder Body */}
        <div className="relative aspect-4/3 bg-black flex items-center justify-center overflow-hidden">
          {errorMsg ? (
            <div className="p-6 text-center space-y-3 max-w-xs">
              <div className="h-12 w-12 rounded-2xl bg-[#e36338]/20 text-[#e36338] grid place-items-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <p className="text-xs text-white/80 font-semibold leading-relaxed">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition inline-flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Target Framing Reticle */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-[#dff47d]/70 rounded-2xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between text-[10px] font-mono text-[#dff47d] uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded w-fit backdrop-blur-xs">
                  <span>{tr('Analyzing Waste Stream')}</span>
                </div>
                <div className="text-center text-[11px] font-semibold text-white/90 bg-black/50 px-3 py-1 rounded-full w-fit mx-auto backdrop-blur-xs shadow-sm">
                  {tr('Hold camera steady and center the items')}
                </div>
              </div>
            </>
          )}

          {/* Hidden Canvas for High-Res Capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#14261e] border-t border-[#234235] flex items-center justify-around gap-4">
          {hasMultipleCameras ? (
            <button
              type="button"
              onClick={handleFlipCamera}
              className="flex flex-col items-center gap-1 text-[11px] font-extrabold text-[#95b8a5] hover:text-white transition"
              title="Switch Front/Rear Camera"
            >
              <div className="h-10 w-10 rounded-full bg-white/10 grid place-items-center">
                <RefreshCw size={17} />
              </div>
              <span>{tr('Flip Camera')}</span>
            </button>
          ) : (
            <div className="w-12" />
          )}

          {/* Shutter Button */}
          <button
            type="button"
            disabled={!stream || !!errorMsg || isCapturing}
            onClick={handleTakeSnapshot}
            className="h-16 w-16 rounded-full bg-white border-4 border-[#173f32] ring-4 ring-[#dff47d] flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-xl disabled:opacity-40 disabled:hover:scale-100"
            title="Take Photo"
          >
            <div className="h-11 w-11 rounded-full bg-[#173f32] flex items-center justify-center text-[#dff47d]">
              <Camera size={22} />
            </div>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex flex-col items-center gap-1 text-[11px] font-extrabold text-[#95b8a5] hover:text-white transition"
          >
            <div className="h-10 w-10 rounded-full bg-white/10 grid place-items-center">
              <X size={17} />
            </div>
            <span>{tr('Cancel')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

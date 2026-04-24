'use client'

import { useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'

interface ImageUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
}

export function ImageUploader({ files, onChange, maxFiles = 3 }: ImageUploaderProps) {
  const { t } = useLang()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const valid = Array.from(newFiles)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, maxFiles - files.length)
    if (valid.length > 0) onChange([...files, ...valid])
  }

  function remove(i: number) {
    onChange(files.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-400">
        {t('ask.images')}
      </label>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file, i) => (
            <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {files.length < maxFiles && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-6 cursor-pointer transition-colors ${
            dragging ? 'border-violet-500 bg-violet-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/3'
          }`}
        >
          <span className="text-2xl">📷</span>
          <span className="text-sm text-gray-500">{t('ask.imageHint')}</span>
          <span className="text-xs text-gray-700">{files.length} / {maxFiles}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

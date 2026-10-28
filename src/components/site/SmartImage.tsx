import { useState } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  eager?: boolean
}

/** Img dengan lazy-load + fade-in mulus */
export default function SmartImage({ src, alt, className = '', eager }: Props) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={eager ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
      className={`img-fade ${loaded ? 'loaded' : ''} ${className}`}
    />
  )
}

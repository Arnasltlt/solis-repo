import Link from 'next/link'
import Image from 'next/image'
import { theme } from '@/styles/theme'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
}

const sizes = {
  small: {
    height: 24,
    width: 100
  },
  medium: {
    height: 32,
    width: 133
  },
  large: {
    height: 48,
    width: 200
  }
}

export function Logo({ size = 'medium' }: LogoProps) {
  const { height, width } = sizes[size]

  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/images/logo.png"
        alt="Solis Logo"
        height={height}
        width={width}
        style={{ 
          objectFit: 'contain',
          height: 'auto'
        }}
        priority
      />
    </Link>
  )
} 
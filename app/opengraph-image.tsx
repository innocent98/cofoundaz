import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'Cofoundaz: The co-founder who never sleeps.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  // process.cwd() is the Next.js project directory; the light wordmark reads on the dark card.
  const wordmark = await readFile(join(process.cwd(), 'public/brand/cofoundaz-wordmark-light.png'))
  const wordmarkSrc = `data:image/png;base64,${wordmark.toString('base64')}`
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#12291F',
          padding: '80px',
        }}
      >
        <img src={wordmarkSrc} alt="Cofoundaz" width={295} height={48} />
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
          The co-founder who never sleeps.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#B3D0C3', maxWidth: 900 }}>
          The operating system that takes founders from idea to profitability.
        </div>
      </div>
    ),
    size
  )
}

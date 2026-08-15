import { ImageResponse } from 'next/og'

export const alt = 'Cofoundaz — The co-founder who never sleeps.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 14, background: '#1E4D3B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '4px solid #BDA05F', borderRightColor: 'transparent',
              }}
            />
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: '#FFFFFF' }}>Cofoundaz</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 76, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.05 }}>
          The co-founder who never sleeps.
        </div>
        <div style={{ marginTop: 28, fontSize: 30, color: '#B3D0C3', maxWidth: 900 }}>
          The AI operating system that takes founders from idea to profitability.
        </div>
      </div>
    ),
    size
  )
}

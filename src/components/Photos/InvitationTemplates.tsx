import React from 'react';
import { InvitationData } from './types';

/**
 * Professional Invitation Templates
 * Each template is a self-contained component with modern design
 * Supports responsive scaling and manual guest name field
 */

// Helper component for manual guest name field (blank line for handwriting)
const ManualGuestNameField: React.FC<{ color: string }> = ({ color }) => (
  <div className="text-center my-2">
    <p className="text-xs mb-1" style={{ color }}>
      Prezado(a)
    </p>
    <div
      className="mx-auto border-b-2 mb-1"
      style={{
        borderColor: color,
        width: '70%',
        height: '20px',
      }}
    />
  </div>
);

// ============================================
// WEDDING TEMPLATES
// ============================================

export const WeddingElegantTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { orientation, groomName, brideName, guestName, includeGuestName, showManualGuestField } = data;
  const isLandscape = orientation === 'landscape';

  return (
    <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}>
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${data.theme.primaryColor}15 0%, ${data.theme.secondaryColor}15 100%)`,
        }}
      />

      {/* Ornamental corners - responsive size */}
      <div className="absolute top-1 left-1 opacity-20" style={{ width: '12%', height: '12%' }}>
        <svg viewBox="0 0 100 100" fill={data.theme.accentColor} className="w-full h-full">
          <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" />
          <circle cx="30" cy="30" r="8" />
        </svg>
      </div>
      <div className="absolute top-1 right-1 opacity-20 transform rotate-90" style={{ width: '12%', height: '12%' }}>
        <svg viewBox="0 0 100 100" fill={data.theme.accentColor} className="w-full h-full">
          <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" />
          <circle cx="30" cy="30" r="8" />
        </svg>
      </div>
      <div className="absolute bottom-1 left-1 opacity-20 transform -rotate-90" style={{ width: '12%', height: '12%' }}>
        <svg viewBox="0 0 100 100" fill={data.theme.accentColor} className="w-full h-full">
          <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" />
          <circle cx="30" cy="30" r="8" />
        </svg>
      </div>
      <div className="absolute bottom-1 right-1 opacity-20 transform rotate-180" style={{ width: '12%', height: '12%' }}>
        <svg viewBox="0 0 100 100" fill={data.theme.accentColor} className="w-full h-full">
          <path d="M0,0 L100,0 L100,20 L20,20 L20,100 L0,100 Z" />
          <circle cx="30" cy="30" r="8" />
        </svg>
      </div>

      {/* Content - responsive padding */}
      <div className={`relative z-10 h-full flex flex-col items-center justify-center ${isLandscape ? 'p-[4%]' : 'p-[6%]'}`}>
        {/* Title */}
        <div className="text-center mb-[3%]">
          <h1
            style={{
              color: data.theme.primaryColor,
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(12px, 4vw, 24px)',
              fontWeight: 'bold',
              lineHeight: 1.2,
            }}
          >
            {data.title}
          </h1>
          {data.subtitle && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(8px, 2vw, 14px)',
                fontStyle: 'italic',
              }}
            >
              {data.subtitle}
            </p>
          )}
        </div>

        {/* Names of Bride and Groom */}
        {(groomName || brideName) && (
          <div className="text-center my-[3%]">
            <p
              style={{
                fontFamily: "'Great Vibes', cursive",
                color: data.theme.primaryColor,
                fontSize: 'clamp(14px, 5vw, 32px)',
                lineHeight: 1.1,
              }}
            >
              {groomName || 'Noivo'}
            </p>
            <p
              style={{
                color: data.theme.accentColor,
                fontSize: 'clamp(10px, 2.5vw, 18px)',
              }}
            >
              &
            </p>
            <p
              style={{
                fontFamily: "'Great Vibes', cursive",
                color: data.theme.primaryColor,
                fontSize: 'clamp(14px, 5vw, 32px)',
                lineHeight: 1.1,
              }}
            >
              {brideName || 'Noiva'}
            </p>
          </div>
        )}

        {/* Decorative divider */}
        <div className="flex items-center gap-[2%] my-[2%]">
          <div
            style={{
              backgroundColor: data.theme.accentColor,
              width: '15%',
              height: '1px',
            }}
          />
          <div
            style={{
              backgroundColor: data.theme.accentColor,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              backgroundColor: data.theme.accentColor,
              width: '15%',
              height: '1px',
            }}
          />
        </div>

        {/* Guest name - Auto or Manual */}
        {includeGuestName && (
          showManualGuestField ? (
            <ManualGuestNameField color={data.theme.secondaryColor} />
          ) : guestName ? (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(8px, 2vw, 12px)',
                fontStyle: 'italic',
                marginBottom: '2%',
              }}
            >
              Prezado(a) <span style={{ fontWeight: 600 }}>{guestName}</span>,
            </p>
          ) : null
        )}

        {/* Main text */}
        <div className="text-center" style={{ maxWidth: '85%', marginBottom: '3%' }}>
          <p
            style={{
              color: data.theme.textColor,
              fontSize: 'clamp(6px, 1.8vw, 11px)',
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
            }}
          >
            {data.mainText}
          </p>
        </div>

        {/* Date and time */}
        {(data.date || data.time) && (
          <div className="text-center mb-[2%]">
            {data.date && (
              <p
                style={{
                  color: data.theme.primaryColor,
                  fontSize: 'clamp(8px, 2vw, 13px)',
                  fontWeight: 600,
                }}
              >
                {data.date}
              </p>
            )}
            {data.time && (
              <p
                style={{
                  color: data.theme.secondaryColor,
                  fontSize: 'clamp(7px, 1.8vw, 11px)',
                }}
              >
                às {data.time}
              </p>
            )}
          </div>
        )}

        {/* Location */}
        {data.location && (
          <div className="text-center mb-[2%]">
            <p
              style={{
                color: data.theme.textColor,
                fontSize: 'clamp(6px, 1.6vw, 10px)',
                fontWeight: 500,
              }}
            >
              📍 {data.location}
            </p>
          </div>
        )}

        {/* Additional info */}
        {data.additionalInfo && (
          <div className="text-center mt-auto">
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(5px, 1.4vw, 9px)',
                fontStyle: 'italic',
              }}
            >
              {data.additionalInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// WEDDING NIKAH TEMPLATE (Islamic Wedding)
// ============================================

export const WeddingNikahTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { orientation, groomName, brideName, guestName, includeGuestName, showBismillah, showManualGuestField } = data;
  const isLandscape = orientation === 'landscape';

  return (
    <div className="w-full h-full relative overflow-hidden" style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}>
      {/* Islamic geometric background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #f8f5e6 0%, #e8e4d4 100%)`,
        }}
      />

      {/* Decorative Islamic pattern border */}
      <div className="absolute inset-[3%] border-2 border-double" style={{ borderColor: data.theme.accentColor }}>
        <div className="absolute inset-1 border" style={{ borderColor: `${data.theme.accentColor}40` }} />
      </div>

      {/* Top geometric decoration */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center" style={{ height: '6%' }}>
        <div className="flex items-center gap-[2px]">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="transform rotate-45"
              style={{
                backgroundColor: i === 3 ? data.theme.accentColor : `${data.theme.primaryColor}30`,
                width: 'clamp(4px, 1vw, 10px)',
                height: 'clamp(4px, 1vw, 10px)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`relative z-10 h-full flex flex-col items-center justify-center ${isLandscape ? 'p-[5%]' : 'p-[8%]'}`}>

        {/* Bismillah */}
        {showBismillah && (
          <div className="text-center mb-[3%]">
            <p
              style={{
                fontFamily: "'Amiri', serif",
                color: data.theme.primaryColor,
                fontSize: 'clamp(10px, 4vw, 22px)',
                direction: 'rtl',
                lineHeight: 1.2,
              }}
            >
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(5px, 1.2vw, 8px)',
                fontStyle: 'italic',
                marginTop: '1%',
              }}
            >
              Em nome de Allah, o Clemente, o Misericordioso
            </p>
          </div>
        )}

        {/* Decorative divider */}
        <div className="flex items-center gap-[2%] my-[2%]">
          <div style={{ backgroundColor: data.theme.accentColor, width: '10%', height: '1px' }} />
          <div
            className="transform rotate-45"
            style={{
              backgroundColor: data.theme.accentColor,
              width: 'clamp(4px, 0.8vw, 8px)',
              height: 'clamp(4px, 0.8vw, 8px)',
            }}
          />
          <div style={{ backgroundColor: data.theme.accentColor, width: '10%', height: '1px' }} />
        </div>

        {/* Title */}
        <div className="text-center mb-[2%]">
          <h1
            style={{
              color: data.theme.primaryColor,
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(10px, 3.5vw, 20px)',
              fontWeight: 'bold',
            }}
          >
            {data.title || 'Nikah'}
          </h1>
          {data.subtitle && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(7px, 1.8vw, 12px)',
                fontStyle: 'italic',
              }}
            >
              {data.subtitle}
            </p>
          )}
        </div>

        {/* Names of Bride and Groom */}
        {(groomName || brideName) && (
          <div className="text-center my-[2%]">
            <p
              style={{
                fontFamily: "'Great Vibes', cursive",
                color: data.theme.primaryColor,
                fontSize: 'clamp(12px, 4vw, 26px)',
                lineHeight: 1.1,
              }}
            >
              {groomName || 'Noivo'}
            </p>
            <p
              style={{
                color: data.theme.accentColor,
                fontSize: 'clamp(8px, 2vw, 14px)',
                fontWeight: 'bold',
              }}
            >
              ❦
            </p>
            <p
              style={{
                fontFamily: "'Great Vibes', cursive",
                color: data.theme.primaryColor,
                fontSize: 'clamp(12px, 4vw, 26px)',
                lineHeight: 1.1,
              }}
            >
              {brideName || 'Noiva'}
            </p>
          </div>
        )}

        {/* Guest name - Auto or Manual */}
        {includeGuestName && (
          showManualGuestField ? (
            <ManualGuestNameField color={data.theme.secondaryColor} />
          ) : guestName ? (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(7px, 1.8vw, 11px)',
                fontStyle: 'italic',
                marginBottom: '2%',
              }}
            >
              Estimado(a) <span style={{ fontWeight: 600 }}>{guestName}</span>,
            </p>
          ) : null
        )}

        {/* Main text */}
        <div className="text-center" style={{ maxWidth: '85%', marginBottom: '2%' }}>
          <p
            style={{
              color: data.theme.textColor,
              fontSize: 'clamp(5px, 1.6vw, 10px)',
              lineHeight: 1.4,
              whiteSpace: 'pre-line',
            }}
          >
            {data.mainText}
          </p>
        </div>

        {/* Date and time */}
        {(data.date || data.time) && (
          <div className="text-center mb-[2%]">
            {data.date && (
              <p
                style={{
                  color: data.theme.primaryColor,
                  fontSize: 'clamp(7px, 1.8vw, 12px)',
                  fontWeight: 600,
                }}
              >
                {data.date}
              </p>
            )}
            {data.time && (
              <p
                style={{
                  color: data.theme.secondaryColor,
                  fontSize: 'clamp(6px, 1.5vw, 10px)',
                }}
              >
                às {data.time}
              </p>
            )}
          </div>
        )}

        {/* Location */}
        {data.location && (
          <div className="text-center mb-[1%]">
            <p
              style={{
                color: data.theme.textColor,
                fontSize: 'clamp(5px, 1.4vw, 9px)',
                fontWeight: 500,
              }}
            >
              🕌 {data.location}
            </p>
          </div>
        )}

        {/* Additional info */}
        {data.additionalInfo && (
          <div className="text-center mt-auto">
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(4px, 1.2vw, 8px)',
                fontStyle: 'italic',
              }}
            >
              {data.additionalInfo}
            </p>
          </div>
        )}
      </div>

      {/* Bottom geometric decoration */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center" style={{ height: '6%' }}>
        <div className="flex items-center gap-[2px]">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="transform rotate-45"
              style={{
                backgroundColor: i === 3 ? data.theme.accentColor : `${data.theme.primaryColor}30`,
                width: 'clamp(4px, 1vw, 10px)',
                height: 'clamp(4px, 1vw, 10px)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// BIRTHDAY TEMPLATES
// ============================================

export const BirthdayFunTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { includeGuestName, guestName, showManualGuestField } = data;

  return (
    <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}>
      {/* Colorful background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top right, ${data.theme.primaryColor}20, transparent 50%),
                       radial-gradient(circle at bottom left, ${data.theme.secondaryColor}20, transparent 50%)`,
        }}
      />

      {/* Confetti decoration */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-30"
          style={{
            backgroundColor: i % 3 === 0 ? data.theme.primaryColor : i % 3 === 1 ? data.theme.secondaryColor : data.theme.accentColor,
            top: `${(i * 7) % 100}%`,
            left: `${(i * 13) % 100}%`,
            width: 'clamp(3px, 0.8vw, 8px)',
            height: 'clamp(3px, 0.8vw, 8px)',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-[6%]">
        <div className="text-center">
          <h1
            style={{
              color: data.theme.primaryColor,
              fontSize: 'clamp(16px, 6vw, 40px)',
              fontWeight: 'bold',
              marginBottom: '3%',
            }}
          >
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(10px, 3vw, 20px)',
                fontWeight: 600,
                marginBottom: '4%',
              }}
            >
              {data.subtitle}
            </p>
          )}

          {/* Guest name */}
          {includeGuestName && (
            showManualGuestField ? (
              <ManualGuestNameField color={data.theme.secondaryColor} />
            ) : guestName ? (
              <p
                style={{
                  color: data.theme.secondaryColor,
                  fontSize: 'clamp(8px, 2vw, 14px)',
                  fontStyle: 'italic',
                  marginBottom: '3%',
                }}
              >
                Olá <span style={{ fontWeight: 600 }}>{guestName}</span>!
              </p>
            ) : null
          )}

          <div style={{ maxWidth: '85%', margin: '0 auto 4%' }}>
            <p
              style={{
                color: data.theme.textColor,
                fontSize: 'clamp(7px, 2vw, 14px)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {data.mainText}
            </p>
          </div>

          {data.date && (
            <div style={{ marginBottom: '3%' }}>
              <p
                style={{
                  color: data.theme.accentColor,
                  fontSize: 'clamp(9px, 2.5vw, 18px)',
                  fontWeight: 'bold',
                }}
              >
                📅 {data.date}
              </p>
              {data.time && (
                <p
                  style={{
                    color: data.theme.secondaryColor,
                    fontSize: 'clamp(8px, 2vw, 14px)',
                    marginTop: '1%',
                  }}
                >
                  🕐 {data.time}
                </p>
              )}
            </div>
          )}

          {data.location && (
            <p
              style={{
                color: data.theme.textColor,
                fontSize: 'clamp(6px, 1.8vw, 12px)',
                fontWeight: 500,
                marginBottom: '3%',
              }}
            >
              📍 {data.location}
            </p>
          )}

          {data.additionalInfo && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(5px, 1.4vw, 10px)',
                fontStyle: 'italic',
                marginTop: '4%',
              }}
            >
              {data.additionalInfo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// EVENT TEMPLATES
// ============================================

export const EventProfessionalTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { includeGuestName, guestName, showManualGuestField } = data;

  return (
    <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}>
      {/* Modern gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom right, ${data.theme.primaryColor}10, ${data.theme.secondaryColor}10)`,
        }}
      />

      {/* Geometric decoration */}
      <div
        className="absolute top-0 right-0 opacity-5"
        style={{
          background: data.theme.accentColor,
          clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)',
          width: '30%',
          height: '30%',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-[6%]">
        {/* Header bar */}
        <div
          style={{
            backgroundColor: data.theme.accentColor,
            width: '15%',
            height: '3px',
            marginBottom: '4%',
          }}
        />

        <div className="flex-1 flex flex-col justify-center">
          <h1
            style={{
              color: data.theme.primaryColor,
              fontSize: 'clamp(12px, 4vw, 26px)',
              fontWeight: 'bold',
              marginBottom: '2%',
            }}
          >
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(8px, 2.5vw, 16px)',
                fontWeight: 500,
                marginBottom: '4%',
              }}
            >
              {data.subtitle}
            </p>
          )}

          {/* Guest name */}
          {includeGuestName && (
            showManualGuestField ? (
              <ManualGuestNameField color={data.theme.secondaryColor} />
            ) : guestName ? (
              <p
                style={{
                  color: data.theme.secondaryColor,
                  fontSize: 'clamp(7px, 1.8vw, 12px)',
                  marginBottom: '3%',
                }}
              >
                Caro(a) <span style={{ fontWeight: 600 }}>{guestName}</span>,
              </p>
            ) : null
          )}

          <div style={{ maxWidth: '90%', marginBottom: '5%' }}>
            <p
              style={{
                color: data.theme.textColor,
                fontSize: 'clamp(6px, 1.8vw, 12px)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {data.mainText}
            </p>
          </div>

          <div style={{ marginBottom: '3%' }}>
            {data.date && (
              <div className="flex items-center gap-[2%]" style={{ marginBottom: '1%' }}>
                <span
                  style={{
                    color: data.theme.primaryColor,
                    fontSize: 'clamp(6px, 1.6vw, 11px)',
                    fontWeight: 600,
                  }}
                >
                  Data:
                </span>
                <span
                  style={{
                    color: data.theme.textColor,
                    fontSize: 'clamp(6px, 1.6vw, 11px)',
                  }}
                >
                  {data.date}
                </span>
              </div>
            )}

            {data.time && (
              <div className="flex items-center gap-[2%]" style={{ marginBottom: '1%' }}>
                <span
                  style={{
                    color: data.theme.primaryColor,
                    fontSize: 'clamp(6px, 1.6vw, 11px)',
                    fontWeight: 600,
                  }}
                >
                  Horário:
                </span>
                <span
                  style={{
                    color: data.theme.textColor,
                    fontSize: 'clamp(6px, 1.6vw, 11px)',
                  }}
                >
                  {data.time}
                </span>
              </div>
            )}

            {data.location && (
              <div className="flex items-center gap-[2%]">
                <span
                  style={{
                    color: data.theme.primaryColor,
                    fontSize: 'clamp(6px, 1.6vw, 11px)',
                    fontWeight: 600,
                  }}
                >
                  Local:
                </span>
                <span
                  style={{
                    color: data.theme.textColor,
                    fontSize: 'clamp(6px, 1.6vw, 11px)',
                  }}
                >
                  {data.location}
                </span>
              </div>
            )}
          </div>

          {data.additionalInfo && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(5px, 1.4vw, 9px)',
                fontStyle: 'italic',
                marginTop: '4%',
              }}
            >
              {data.additionalInfo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// CORPORATE TEMPLATES
// ============================================

export const CorporateMinimalTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { includeGuestName, guestName, showManualGuestField } = data;

  return (
    <div className="w-full h-full relative overflow-hidden bg-white" style={{ fontSize: 'clamp(6px, 1.5vw, 12px)' }}>
      {/* Minimal header bar */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          backgroundColor: data.theme.primaryColor,
          height: '2%',
        }}
      />

      {/* Content */}
      <div className="h-full flex flex-col p-[8%]" style={{ paddingTop: '10%' }}>
        <div className="flex-1 flex flex-col justify-center">
          <h1
            style={{
              color: data.theme.primaryColor,
              fontSize: 'clamp(10px, 3vw, 20px)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '3%',
            }}
          >
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(7px, 2vw, 14px)',
                fontWeight: 500,
                marginBottom: '5%',
              }}
            >
              {data.subtitle}
            </p>
          )}

          {/* Guest name */}
          {includeGuestName && (
            showManualGuestField ? (
              <ManualGuestNameField color={data.theme.secondaryColor} />
            ) : guestName ? (
              <p
                style={{
                  color: data.theme.textColor,
                  fontSize: 'clamp(6px, 1.6vw, 11px)',
                  marginBottom: '3%',
                }}
              >
                Prezado(a) <span style={{ fontWeight: 600 }}>{guestName}</span>,
              </p>
            ) : null
          )}

          <div style={{ marginBottom: '5%' }}>
            <p
              style={{
                color: data.theme.textColor,
                fontSize: 'clamp(6px, 1.8vw, 12px)',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}
            >
              {data.mainText}
            </p>
          </div>

          <div style={{ marginBottom: '5%' }}>
            {data.date && (
              <p
                style={{
                  color: data.theme.textColor,
                  fontSize: 'clamp(6px, 1.6vw, 11px)',
                  fontWeight: 600,
                }}
              >
                {data.date} {data.time && `• ${data.time}`}
              </p>
            )}

            {data.location && (
              <p
                style={{
                  color: data.theme.secondaryColor,
                  fontSize: 'clamp(6px, 1.6vw, 11px)',
                  marginTop: '2%',
                }}
              >
                {data.location}
              </p>
            )}
          </div>

          {data.additionalInfo && (
            <p
              style={{
                color: data.theme.secondaryColor,
                fontSize: 'clamp(5px, 1.3vw, 9px)',
                marginTop: 'auto',
              }}
            >
              {data.additionalInfo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// WEDDING NIKAH GOLD TEMPLATE (Elegant Islamic Design)
// Inspired by traditional nikah invitation with golden accents
// ============================================

export const WeddingNikahGoldTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { groomName, brideName, guestName, includeGuestName, showBismillah, showManualGuestField } = data;

  const goldColor = '#C9A227';
  const darkGold = '#8B6914';

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #FFFEF5 0%, #FFF9E6 50%, #FFFEF5 100%)',
        fontSize: 'clamp(6px, 1.5vw, 12px)',
      }}
    >
      {/* Double golden border frame */}
      <div
        className="absolute"
        style={{
          inset: '3%',
          border: `3px solid ${goldColor}`,
          borderRadius: '4px',
        }}
      />
      <div
        className="absolute"
        style={{
          inset: '4.5%',
          border: `1px solid ${goldColor}`,
          borderRadius: '2px',
        }}
      />

      {/* Corner lanterns - Top Left */}
      <div className="absolute" style={{ top: '2%', left: '2%', width: '10%', height: '15%' }}>
        <svg viewBox="0 0 40 60" fill={goldColor} className="w-full h-full opacity-80">
          <path d="M20,0 L25,5 L25,10 L30,15 L30,45 L25,50 L25,55 L20,60 L15,55 L15,50 L10,45 L10,15 L15,10 L15,5 Z" />
          <circle cx="20" cy="30" r="5" fill="#FFF9E6" />
        </svg>
      </div>
      {/* Corner lanterns - Top Right */}
      <div className="absolute" style={{ top: '2%', right: '2%', width: '10%', height: '15%' }}>
        <svg viewBox="0 0 40 60" fill={goldColor} className="w-full h-full opacity-80">
          <path d="M20,0 L25,5 L25,10 L30,15 L30,45 L25,50 L25,55 L20,60 L15,55 L15,50 L10,45 L10,15 L15,10 L15,5 Z" />
          <circle cx="20" cy="30" r="5" fill="#FFF9E6" />
        </svg>
      </div>
      {/* Corner lanterns - Bottom Left */}
      <div className="absolute" style={{ bottom: '2%', left: '2%', width: '10%', height: '15%' }}>
        <svg viewBox="0 0 40 60" fill={goldColor} className="w-full h-full opacity-60">
          <path d="M20,0 L25,5 L25,10 L30,15 L30,45 L25,50 L25,55 L20,60 L15,55 L15,50 L10,45 L10,15 L15,10 L15,5 Z" />
          <circle cx="20" cy="30" r="5" fill="#FFF9E6" />
        </svg>
      </div>
      {/* Corner lanterns - Bottom Right */}
      <div className="absolute" style={{ bottom: '2%', right: '2%', width: '10%', height: '15%' }}>
        <svg viewBox="0 0 40 60" fill={goldColor} className="w-full h-full opacity-60">
          <path d="M20,0 L25,5 L25,10 L30,15 L30,45 L25,50 L25,55 L20,60 L15,55 L15,50 L10,45 L10,15 L15,10 L15,5 Z" />
          <circle cx="20" cy="30" r="5" fill="#FFF9E6" />
        </svg>
      </div>

      {/* Wedding rings with leaves at top center */}
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: '6%', width: '25%', height: '12%' }}>
        <svg viewBox="0 0 100 50" className="w-full h-full">
          {/* Leaves */}
          <ellipse cx="25" cy="25" rx="8" ry="18" fill="#4A7C59" transform="rotate(-45 25 25)" opacity="0.8" />
          <ellipse cx="75" cy="25" rx="8" ry="18" fill="#4A7C59" transform="rotate(45 75 25)" opacity="0.8" />
          <ellipse cx="35" cy="20" rx="6" ry="14" fill="#5C8A4D" transform="rotate(-30 35 20)" opacity="0.7" />
          <ellipse cx="65" cy="20" rx="6" ry="14" fill="#5C8A4D" transform="rotate(30 65 20)" opacity="0.7" />
          {/* Rings */}
          <circle cx="42" cy="28" r="12" fill="none" stroke={goldColor} strokeWidth="3" />
          <circle cx="58" cy="28" r="12" fill="none" stroke={goldColor} strokeWidth="3" />
          <circle cx="42" cy="28" r="9" fill="none" stroke={darkGold} strokeWidth="1" />
          <circle cx="58" cy="28" r="9" fill="none" stroke={darkGold} strokeWidth="1" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-start pt-[18%] px-[8%] pb-[6%]">
        {/* Names of Bride and Groom */}
        <div className="flex items-center justify-center gap-[8%] mb-[2%]" style={{ width: '100%' }}>
          <p
            style={{
              fontFamily: "'Great Vibes', cursive",
              color: darkGold,
              fontSize: 'clamp(14px, 5vw, 32px)',
              lineHeight: 1,
            }}
          >
            {groomName || 'Noivo'}
          </p>
          <p
            style={{
              fontFamily: "'Great Vibes', cursive",
              color: darkGold,
              fontSize: 'clamp(14px, 5vw, 32px)',
              lineHeight: 1,
            }}
          >
            {brideName || 'Noiva'}
          </p>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Great Vibes', cursive",
            color: darkGold,
            fontSize: 'clamp(12px, 4vw, 26px)',
            marginBottom: '4%',
          }}
        >
          Convite de Nikah
        </h1>

        {/* Guest name field */}
        {includeGuestName && (
          <div className="w-full mb-[2%]" style={{ textAlign: 'left' }}>
            <div className="flex items-center gap-[2%]">
              <span
                style={{
                  color: '#333',
                  fontSize: 'clamp(7px, 1.8vw, 11px)',
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                Sr./Sr.ª
              </span>
              {showManualGuestField ? (
                <div
                  style={{
                    flex: 1,
                    borderBottom: `1px solid ${darkGold}`,
                    height: '16px',
                  }}
                />
              ) : guestName ? (
                <span
                  style={{
                    color: darkGold,
                    fontSize: 'clamp(8px, 2vw, 12px)',
                    fontWeight: 600,
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {guestName}
                </span>
              ) : (
                <div
                  style={{
                    flex: 1,
                    borderBottom: `1px solid ${darkGold}`,
                    height: '16px',
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Main text */}
        <div className="w-full" style={{ marginBottom: '3%' }}>
          <p
            style={{
              color: '#333',
              fontSize: 'clamp(6px, 1.6vw, 10px)',
              lineHeight: 1.5,
              whiteSpace: 'pre-line',
              fontFamily: "'Playfair Display', serif",
              textAlign: 'justify',
            }}
          >
            {data.mainText}
          </p>
        </div>

        {/* Date, time and location */}
        {(data.date || data.time) && (
          <div className="w-full" style={{ marginBottom: '2%', textAlign: 'left' }}>
            <p
              style={{
                color: '#333',
                fontSize: 'clamp(6px, 1.5vw, 10px)',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              A cerimónia está marcada para as <strong style={{ color: darkGold }}>{data.time || '15h'}</strong>
              {data.date && `, no dia ${data.date}`}.
            </p>
          </div>
        )}

        {data.location && (
          <div className="w-full" style={{ marginBottom: '2%', textAlign: 'left' }}>
            <p
              style={{
                color: '#333',
                fontSize: 'clamp(6px, 1.5vw, 10px)',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Local: <strong style={{ color: darkGold }}>{data.location}</strong>
            </p>
          </div>
        )}

        {/* Additional info */}
        {data.additionalInfo && (
          <div className="w-full" style={{ marginBottom: '3%', textAlign: 'left' }}>
            <p
              style={{
                color: '#333',
                fontSize: 'clamp(5px, 1.4vw, 9px)',
                fontFamily: "'Playfair Display', serif",
              }}
            >
              {data.additionalInfo}
            </p>
          </div>
        )}

        {/* Closing message */}
        <p
          style={{
            color: '#333',
            fontSize: 'clamp(6px, 1.5vw, 10px)',
            fontFamily: "'Playfair Display', serif",
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 'auto',
          }}
        >
          A sua presença tornará este momento ainda mais especial.
        </p>

        {/* InshAllah logo/text at bottom */}
        <div className="mt-[3%] flex flex-col items-center">
          <p
            style={{
              fontFamily: "'Great Vibes', cursive",
              color: darkGold,
              fontSize: 'clamp(10px, 3vw, 18px)',
            }}
          >
            inShallah
          </p>
          {/* Crescent moon */}
          <svg viewBox="0 0 30 30" style={{ width: 'clamp(10px, 3vw, 20px)', height: 'clamp(10px, 3vw, 20px)' }}>
            <path
              d="M15,2 A13,13 0 1,1 15,28 A10,10 0 1,0 15,2"
              fill={goldColor}
            />
          </svg>
        </div>
      </div>

      {/* Decorative rings at bottom corners */}
      <div className="absolute" style={{ bottom: '8%', left: '6%', width: '12%', height: '10%', opacity: 0.4 }}>
        <svg viewBox="0 0 50 40" className="w-full h-full">
          <circle cx="18" cy="20" r="14" fill="none" stroke={goldColor} strokeWidth="3" />
          <circle cx="32" cy="20" r="14" fill="none" stroke={goldColor} strokeWidth="3" />
        </svg>
      </div>
      <div className="absolute" style={{ bottom: '8%', right: '6%', width: '12%', height: '10%', opacity: 0.4 }}>
        <svg viewBox="0 0 50 40" className="w-full h-full">
          <circle cx="18" cy="20" r="14" fill="none" stroke={goldColor} strokeWidth="3" />
          <circle cx="32" cy="20" r="14" fill="none" stroke={goldColor} strokeWidth="3" />
        </svg>
      </div>
    </div>
  );
};

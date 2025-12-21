import React from 'react';
import { InvitationData } from './types';

/**
 * Professional Invitation Templates
 * Each template is a self-contained component with modern design
 */

// ============================================
// WEDDING TEMPLATES
// ============================================

export const WeddingElegantTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  const { orientation } = data;
  const isLandscape = orientation === 'landscape';

  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${data.theme.primaryColor}15 0%, ${data.theme.secondaryColor}15 100%)`,
        }}
      />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" fill={data.theme.accentColor}>
          <path d="M50,20 L61,48 L90,48 L67,63 L78,91 L50,76 L22,91 L33,63 L10,48 L39,48 Z" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-10 transform rotate-180">
        <svg viewBox="0 0 100 100" fill={data.theme.accentColor}>
          <path d="M50,20 L61,48 L90,48 L67,63 L78,91 L50,76 L22,91 L33,63 L10,48 L39,48 Z" />
        </svg>
      </div>

      {/* Content */}
      <div className={`relative z-10 h-full flex flex-col items-center justify-center p-8 ${isLandscape ? 'py-6' : 'py-12'}`}>
        {/* Title */}
        <div className="text-center mb-6">
          <h1
            className="font-serif text-4xl font-bold mb-2"
            style={{ color: data.theme.primaryColor }}
          >
            {data.title}
          </h1>
          {data.subtitle && (
            <p
              className="text-lg font-light italic"
              style={{ color: data.theme.secondaryColor }}
            >
              {data.subtitle}
            </p>
          )}
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-3 my-4">
          <div
            className="w-16 h-px"
            style={{ backgroundColor: data.theme.accentColor }}
          />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: data.theme.accentColor }}
          />
          <div
            className="w-16 h-px"
            style={{ backgroundColor: data.theme.accentColor }}
          />
        </div>

        {/* Main text */}
        <div className="text-center max-w-md mb-6">
          <p
            className="text-base leading-relaxed whitespace-pre-line"
            style={{ color: data.theme.textColor }}
          >
            {data.mainText}
          </p>
        </div>

        {/* Date and time */}
        {(data.date || data.time) && (
          <div className="text-center mb-4">
            {data.date && (
              <p
                className="text-lg font-semibold"
                style={{ color: data.theme.primaryColor }}
              >
                {data.date}
              </p>
            )}
            {data.time && (
              <p
                className="text-sm"
                style={{ color: data.theme.secondaryColor }}
              >
                {data.time}
              </p>
            )}
          </div>
        )}

        {/* Location */}
        {data.location && (
          <div className="text-center mb-4">
            <p
              className="text-sm font-medium"
              style={{ color: data.theme.textColor }}
            >
              {data.location}
            </p>
          </div>
        )}

        {/* Additional info */}
        {data.additionalInfo && (
          <div className="text-center mt-auto">
            <p
              className="text-xs italic"
              style={{ color: data.theme.secondaryColor }}
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
// BIRTHDAY TEMPLATES
// ============================================

export const BirthdayFunTemplate: React.FC<{ data: InvitationData }> = ({ data }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      {/* Colorful background */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top right, ${data.theme.primaryColor}20, transparent 50%),
                       radial-gradient(circle at bottom left, ${data.theme.secondaryColor}20, transparent 50%)`,
        }}
      />

      {/* Confetti decoration */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-30"
          style={{
            backgroundColor: i % 3 === 0 ? data.theme.primaryColor : i % 3 === 1 ? data.theme.secondaryColor : data.theme.accentColor,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1
            className="font-bold text-5xl mb-4"
            style={{ color: data.theme.primaryColor }}
          >
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              className="text-2xl font-semibold mb-6"
              style={{ color: data.theme.secondaryColor }}
            >
              {data.subtitle}
            </p>
          )}

          <div className="max-w-sm mx-auto mb-8">
            <p
              className="text-base leading-relaxed whitespace-pre-line"
              style={{ color: data.theme.textColor }}
            >
              {data.mainText}
            </p>
          </div>

          {data.date && (
            <div className="mb-4">
              <p
                className="text-xl font-bold"
                style={{ color: data.theme.accentColor }}
              >
                📅 {data.date}
              </p>
              {data.time && (
                <p
                  className="text-lg mt-1"
                  style={{ color: data.theme.secondaryColor }}
                >
                  🕐 {data.time}
                </p>
              )}
            </div>
          )}

          {data.location && (
            <p
              className="text-sm font-medium mb-4"
              style={{ color: data.theme.textColor }}
            >
              📍 {data.location}
            </p>
          )}

          {data.additionalInfo && (
            <p
              className="text-xs italic mt-6"
              style={{ color: data.theme.secondaryColor }}
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
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      {/* Modern gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom right, ${data.theme.primaryColor}10, ${data.theme.secondaryColor}10)`,
        }}
      />

      {/* Geometric decoration */}
      <div
        className="absolute top-0 right-0 w-40 h-40 opacity-5"
        style={{
          background: data.theme.accentColor,
          clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-8">
        {/* Header bar */}
        <div
          className="w-16 h-1 mb-6"
          style={{ backgroundColor: data.theme.accentColor }}
        />

        <div className="flex-1 flex flex-col justify-center">
          <h1
            className="font-bold text-3xl mb-3"
            style={{ color: data.theme.primaryColor }}
          >
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              className="text-lg font-medium mb-6"
              style={{ color: data.theme.secondaryColor }}
            >
              {data.subtitle}
            </p>
          )}

          <div className="max-w-md mb-8">
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: data.theme.textColor }}
            >
              {data.mainText}
            </p>
          </div>

          <div className="space-y-2">
            {data.date && (
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-sm"
                  style={{ color: data.theme.primaryColor }}
                >
                  Data:
                </span>
                <span
                  className="text-sm"
                  style={{ color: data.theme.textColor }}
                >
                  {data.date}
                </span>
              </div>
            )}

            {data.time && (
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-sm"
                  style={{ color: data.theme.primaryColor }}
                >
                  Horário:
                </span>
                <span
                  className="text-sm"
                  style={{ color: data.theme.textColor }}
                >
                  {data.time}
                </span>
              </div>
            )}

            {data.location && (
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-sm"
                  style={{ color: data.theme.primaryColor }}
                >
                  Local:
                </span>
                <span
                  className="text-sm"
                  style={{ color: data.theme.textColor }}
                >
                  {data.location}
                </span>
              </div>
            )}
          </div>

          {data.additionalInfo && (
            <p
              className="text-xs italic mt-6"
              style={{ color: data.theme.secondaryColor }}
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
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      {/* Minimal background */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: data.theme.primaryColor }}
      />

      {/* Content */}
      <div className="h-full flex flex-col p-10">
        <div className="flex-1 flex flex-col justify-center">
          <h1
            className="font-bold text-2xl uppercase tracking-wide mb-4"
            style={{ color: data.theme.primaryColor }}
          >
            {data.title}
          </h1>

          {data.subtitle && (
            <p
              className="text-base font-medium mb-8"
              style={{ color: data.theme.secondaryColor }}
            >
              {data.subtitle}
            </p>
          )}

          <div className="mb-8">
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: data.theme.textColor }}
            >
              {data.mainText}
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {data.date && (
              <p
                className="text-sm font-semibold"
                style={{ color: data.theme.textColor }}
              >
                {data.date} {data.time && `• ${data.time}`}
              </p>
            )}

            {data.location && (
              <p
                className="text-sm"
                style={{ color: data.theme.secondaryColor }}
              >
                {data.location}
              </p>
            )}
          </div>

          {data.additionalInfo && (
            <p
              className="text-xs mt-auto"
              style={{ color: data.theme.secondaryColor }}
            >
              {data.additionalInfo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface BrandLogoProps {
  className?: string;
  size?: number;
}

/** Logotipo oficial SE, reutilizado en la interfaz. */
export default function BrandLogo({ className = "", size = 40 }: BrandLogoProps) {
  return (
    <img
      src="/salesia-se-logo.webp"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "cover", borderRadius: Math.round(size * 0.22), flexShrink: 0 }}
    />
  );
}

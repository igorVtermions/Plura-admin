import Image from "@/components/ui/Image";

type LogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

export function Logo({ width = 140, height = 40, className }: LogoProps) {
  return (
    <Image
      src="/LogoSmall.svg"
      alt="Plura Talks"
      width={width}
      height={height}
      priority
      className={className}
    />
  );
}


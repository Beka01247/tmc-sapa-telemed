import Image from "next/image";

interface BluetoothIconProps {
  size?: number;
  className?: string;
  alt?: string;
}

export const BluetoothIcon = ({
  size = 20,
  className = "",
  alt = "Bluetooth supported",
}: BluetoothIconProps) => {
  return (
    <Image
      src="/icons/bluetooth.svg"
      alt={alt}
      width={size}
      height={size}
      className={className}
    />
  );
};

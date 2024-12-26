'use client';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { ChecksumException, FormatException, NotFoundException } from '@zxing/library';
import { Camera, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CameraComponent() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scannerControls, setScannerControls] = useState<IScannerControls | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        setDevices(videoInputDevices);
        if (videoInputDevices.length > 0) {
          setSelectedDeviceId(videoInputDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error listing devices', error);
      }
    };

    getDevices();

    return () => {
      scannerControls?.stop();
    };
  }, [scannerControls]);

  const handleStart = async () => {
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    const controls = await codeReader.decodeFromVideoDevice(
      selectedDeviceId,
      'video',
      (result, error, _controls) => {
        if (result) {
          setResult(result.getText());

          scannerControls?.stop();
          setScanning(false);
        }
        if (error) {
          if (error instanceof FormatException || error instanceof ChecksumException) {
            console.warn('Checksum of format error, try again...');
          } else if (error instanceof NotFoundException) {
            console.error(`${error instanceof Error ? error.message : error}`);
          } else {
            console.error(`${error instanceof Error ? error.message : error}`);
          }
        }
      }
    );
    setScannerControls(controls);
  };

  const handleStop = () => {
    scannerControls?.stop();
    setScanning(false);
  };

  const handleDeviceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDeviceId(event.target.value);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-row items-center gap-4">
        <div className="w-8"></div>
        {devices.length > 0 && (
          <select
            onChange={handleDeviceChange}
            value={selectedDeviceId}
            className="bg-transparent rounded-md border-[1px] appearance-none px-3 py-1.5"
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || 'Unnamed Device'}
              </option>
            ))}
          </select>
        )}

        <button onClick={handleStart} disabled={scanning} className={`${scanning && 'hidden'}`}>
          <Video className="w-auto h-8" />1
        </button>

        <button onClick={handleStop} disabled={!scanning} className={`${!scanning && 'hidden'}`}>
          <Camera className="w-auto h-8" />2
        </button>
      </div>

      <video id="video" style={{ width: '100%' }} className={`${!scanning && 'hidden'}`}></video>
      {result && <p className="text-3xl font-bold animate-pulse">{result}</p>}
    </div>
  );
}

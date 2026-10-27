"""Encode and verify real browser recordings as 600x400 hover previews."""
import argparse
import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


def first_frame_payload(animation):
    offset = 12
    while offset + 8 <= len(animation):
        size = int.from_bytes(animation[offset + 4:offset + 8], 'little')
        if animation[offset:offset + 4] == b'ANMF':
            data = animation[offset + 24:offset + 8 + size]
            return b'RIFF' + (len(data) + 4).to_bytes(4, 'little') + b'WEBP' + data
        offset += 8 + size + size % 2
    raise ValueError('Missing first animation frame')


def encode(directory, output, target_kib):
    capture = json.loads((directory / 'capture.json').read_text(encoding='utf-8'))
    paths = sorted(directory.glob('frame-*.png'))
    if not 10 <= len(paths) <= 12:
        raise ValueError(f'{directory}: expected 10-12 source frames')
    frames = []
    for path in paths:
        with Image.open(path) as image:
            if image.size != (900, 600):
                raise ValueError(f'{path}: unexpected working viewport {image.size}')
            frames.append(ImageOps.fit(image.convert('RGB'), (600, 400), method=Image.Resampling.LANCZOS))
    # Use measured cadence when screenshot transport is slower than the requested cadence.
    intervals = [b['startedMs'] - a['startedMs'] for a, b in zip(capture['frames'], capture['frames'][1:])]
    duration = max(capture['intervalMs'], round(sum(intervals) / len(intervals)))
    attempts = []
    for quality in (80, 74, 68, 62):
        buffer = io.BytesIO()
        frames[0].save(buffer, format='WEBP', save_all=True, append_images=frames[1:],
                       duration=duration, loop=0, quality=quality, method=6, minimize_size=True)
        payload = buffer.getvalue()
        attempts.append({'quality': quality, 'bytes': len(payload)})
        if len(payload) <= target_kib * 1024:
            break
    decoded = []
    durations = []
    with Image.open(io.BytesIO(payload)) as result:
        if result.size != (600, 400) or not 9 <= result.n_frames <= 12 or result.info.get('loop') != 0:
            raise ValueError(f"{capture['type']}: wrong dimensions, merged frames or loop")
        for i in range(result.n_frames):
            result.seek(i)
            decoded.append(result.convert('RGB'))
            durations.append(result.info['duration'])
    unique = len({hashlib.sha256(frame.tobytes()).hexdigest() for frame in decoded})
    if unique != len(decoded) or sum(durations) != duration * len(frames):
        raise ValueError(f"{capture['type']}: duplicate frames or incorrect duration")
    output.mkdir(parents=True, exist_ok=True)
    animation = output / f"{capture['type']}.webp"
    poster = output / f"{capture['type']}.poster.webp"
    animation.write_bytes(payload)
    # Reuse the compressed first frame: identical pixels, no re-encoding and a small poster.
    poster.write_bytes(first_frame_payload(payload))
    with Image.open(poster) as check:
        if check.n_frames != 1 or check.convert('RGB').tobytes() != decoded[0].tobytes():
            raise ValueError('Poster must match the decoded first animation frame exactly')
    sheet = Image.new('RGB', (1200, ((len(decoded) + 4) // 5) * 220), '#172033')
    draw = ImageDraw.Draw(sheet)
    for i, frame in enumerate(decoded):
        x, y = i % 5 * 240, i // 5 * 220
        sheet.paste(frame.resize((240, 160)), (x, y + 24))
        draw.text((x + 8, y + 6), f'Frame {i + 1:02}', fill='white')
    sheet.save(directory.parent / 'contact.jpg', quality=88)
    report = {
        'type': capture['type'], 'name': capture['name'], 'url': capture['url'],
        'original': capture['original'], 'animation': f'./preview/animated/{animation.name}',
        'poster': f'./preview/animated/{poster.name}', 'width': 600, 'height': 400,
        'frames': len(decoded), 'sourceFrames': len(frames), 'uniqueFrames': unique, 'frameDurationsMs': durations,
        'durationMs': sum(durations), 'loop': 0, 'motion': capture['motion'],
        'bytes': len(payload), 'posterBytes': poster.stat().st_size,
        'quality': quality, 'targetKiB': target_kib, 'attempts': attempts,
        'captureMinIntervalMs': capture['minIntervalMs'], 'captureMaxIntervalMs': capture['maxIntervalMs'],
    }
    (directory.parent / 'encoding.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('recordings', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--target-kib', type=int, default=180)
    args = parser.parse_args()
    reports = []
    errors = []
    for recording in sorted(args.recordings.glob('*/frames/capture.json')):
        previous_report = recording.parent.parent / 'encoding.json'
        if previous_report.exists() and previous_report.stat().st_mtime >= recording.stat().st_mtime:
            report = json.loads(previous_report.read_text(encoding='utf-8'))
            # Re-extract small posters for previously encoded recordings.
            animation = args.output / f"{report['type']}.webp"
            poster = args.output / f"{report['type']}.poster.webp"
            poster.write_bytes(first_frame_payload(animation.read_bytes()))
            report['posterBytes'] = poster.stat().st_size
            previous_report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        else:
            try:
                report = encode(recording.parent, args.output, args.target_kib)
            except ValueError as error:
                errors.append(str(error))
                print(json.dumps({'error': str(error)}, ensure_ascii=False), flush=True)
                continue
        reports.append(report)
        print(json.dumps({key: report[key] for key in ('type', 'bytes', 'posterBytes', 'motion')}, ensure_ascii=False), flush=True)
    (args.recordings / 'encoded.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
    if errors:
        raise SystemExit(f'{len(errors)} recordings need another pass')


if __name__ == '__main__':
    main()

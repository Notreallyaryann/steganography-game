"use client";
import { useState } from "react";
import Link from "next/link";

export default function StudyClient() {
  // Interactive Bit Inspector Demo State
  const [sampleChar, setSampleChar] = useState("A");
  const [pixelR, setPixelR] = useState(180);
  const [chosenPlane, setChosenPlane] = useState(1);
  const [payloadBit, setPayloadBit] = useState(1);

  // Compute modified pixel value
  const bitIndex = chosenPlane - 1;
  const originalBit = (pixelR >> bitIndex) & 1;
  const modifiedR = (pixelR & ~(1 << bitIndex)) | (payloadBit << bitIndex);

  const charCode = sampleChar.charCodeAt(0) || 65;
  const binaryString = charCode.toString(2).padStart(8, "0");

  return (
    <main className="wrap">
      <p className="crumb">
        <Link href="/">Home</Link> / Field Manual & Steganography Study
      </p>

      <section className="hero">
        <h1>
          Steganography Field Manual & Tutorial
        </h1>
        <p className="lede">
          From binary bytes to sub-perceptual pixel manipulation: how digital image and audio steganography works,
          how data is hidden into bit planes, and the forensic signatures that reveal it.
        </p>
      </section>

      {/* Navigation Jumps */}
      <nav className="study-toc" aria-label="Table of Contents">
        <span className="toc-title">JUMP TO SECTION:</span>
        <a href="#pixels">1. Pixels & RGBA</a>
        <a href="#bits">2. LSB vs MSB</a>
        <a href="#pipeline">3. The Embedding Pipeline</a>
        <a href="#bitplanes">4. Bit Planes & Slicing</a>
        <a href="#variables">5. Direction, Channels & Order</a>
        <a href="#detection">6. Visual Steganalysis</a>
      </nav>

      {/* SECTION 1: THE PIXEL MODEL */}
      <section id="pixels" className="panel study-section">
        <h2>1. The Canvas & Digital Pixel Model</h2>
        <p>
          In computer graphics, raster images (like PNGs or Canvas buffers) are flat arrays of numbers.
          Every full-color image is a rectangular grid of <strong>pixels</strong>, where each pixel is
          composed of four 8-bit integers known as <strong>RGBA</strong>:
        </p>

        <div className="study-grid-4">
          <div className="study-card">
            <span className="badge red">Red (R)</span>
            <p className="mono">0 – 255 (8 bits)</p>
            <p className="note">Intensity of red channel</p>
          </div>
          <div className="study-card">
            <span className="badge green">Green (G)</span>
            <p className="mono">0 – 255 (8 bits)</p>
            <p className="note">Intensity of green channel</p>
          </div>
          <div className="study-card">
            <span className="badge blue">Blue (B)</span>
            <p className="mono">0 – 255 (8 bits)</p>
            <p className="note">Intensity of blue channel</p>
          </div>
          <div className="study-card">
            <span className="badge alpha">Alpha (A)</span>
            <p className="mono">0 – 255 (8 bits)</p>
            <p className="note">Opacity (typically 255 = 100%)</p>
          </div>
        </div>

        <p>
          In HTML5 Canvas and JavaScript (<span className="mono">ImageData.data</span>), these pixels
          are stored sequentially in a 1D <span className="mono">Uint8ClampedArray</span>:
        </p>
        <pre className="mono">
{`// Memory layout: [R0, G0, B0, A0,   R1, G1, B1, A1,   R2, G2, B2, A2, ...]
const pixelIndex = (y * width + x);
const byteOffset = pixelIndex * 4; // R=0, G=1, B=2, A=3`}
        </pre>
      </section>

      {/* SECTION 2: BITS, LSB & MSB */}
      <section id="bits" className="panel study-section">
        <h2>2. Anatomy of a Byte: MSB vs LSB</h2>
        <p>
          Each color channel holds an 8-bit integer from <span className="mono">0</span> (<span className="mono">00000000</span>)
          to <span className="mono">255</span> (<span className="mono">11111111</span>). Each position represents a power of 2:
        </p>

        <div className="bit-table-wrap">
          <table className="bit-table">
            <thead>
              <tr>
                <th>Bit #</th>
                <th>Bit 7 (MSB)</th>
                <th>Bit 6</th>
                <th>Bit 5</th>
                <th>Bit 4</th>
                <th>Bit 3</th>
                <th>Bit 2</th>
                <th>Bit 1</th>
                <th>Bit 0 (LSB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Power</strong></td>
                <td>2<sup>7</sup></td>
                <td>2<sup>6</sup></td>
                <td>2<sup>5</sup></td>
                <td>2<sup>4</sup></td>
                <td>2<sup>3</sup></td>
                <td>2<sup>2</sup></td>
                <td>2<sup>1</sup></td>
                <td>2<sup>0</sup></td>
              </tr>
              <tr>
                <td><strong>Decimal Weight</strong></td>
                <td><strong>128</strong></td>
                <td>64</td>
                <td>32</td>
                <td>16</td>
                <td>8</td>
                <td>4</td>
                <td>2</td>
                <td><strong>1</strong></td>
              </tr>
              <tr>
                <td><strong>Visual Impact</strong></td>
                <td className="highlight-msb">Massive color shift</td>
                <td>High</td>
                <td>Moderate</td>
                <td>Moderate</td>
                <td>Subtle</td>
                <td>Very subtle</td>
                <td>Barely visible</td>
                <td className="highlight-lsb">Imperceptible to eye</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="warn" style={{ marginTop: "16px" }}>
          <strong>The Golden Steganographic Insight:</strong>
          <br />
          If a red channel has value <span className="mono">180</span> (<span className="mono">10110100</span>)
          and we flip its least significant bit to <span className="mono">181</span> (<span className="mono">10110101</span>),
          the color change is ΔE ≈ 0.39%. The human eye&apos;s rod and cone cells are biologically incapable
          of distinguishing <span className="mono">rgb(180, 95, 210)</span> from <span className="mono">rgb(181, 95, 210)</span>!
        </div>

        {/* INTERACTIVE BIT FLIPPER */}
        <div className="interactive-widget">
          <div className="widget-header">
            <h3>🔬 Interactive Sub-Perceptual Bit Flipper</h3>
            <span className="badge">LIVE LAB DEMO</span>
          </div>
          <p className="note">
            Test modifying bit planes on a color channel and see if your eyes can detect the difference.
          </p>

          <div className="widget-controls">
            <label>
              Original Channel Value (0–255):
              <input
                type="range"
                min={0}
                max={255}
                value={pixelR}
                onChange={(e) => setPixelR(Number(e.target.value))}
              />
              <span className="mono">{pixelR} (binary: {pixelR.toString(2).padStart(8, "0")})</span>
            </label>

            <label>
              Target Bit Plane (1 = LSB, 8 = MSB):
              <select value={chosenPlane} onChange={(e) => setChosenPlane(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <option key={p} value={p}>
                    Plane {p} (Weight {Math.pow(2, p - 1)}) {p === 1 ? "— LSB (Least visible)" : p === 8 ? "— MSB (Most visible)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Payload Bit to Inject:
              <div className="seg">
                <button
                  type="button"
                  aria-pressed={payloadBit === 0}
                  onClick={() => setPayloadBit(0)}
                >
                  0
                </button>
                <button
                  type="button"
                  aria-pressed={payloadBit === 1}
                  onClick={() => setPayloadBit(1)}
                >
                  1
                </button>
              </div>
            </label>
          </div>

          <div className="swatch-compare">
            <div className="swatch-card">
              <span className="swatch-title">Original Pixel</span>
              <div
                className="color-box"
                style={{ backgroundColor: `rgb(${pixelR}, 100, 180)` }}
              />
              <p className="mono">rgb({pixelR}, 100, 180)</p>
              <p className="note">Bit {bitIndex}: <strong>{originalBit}</strong></p>
            </div>

            <div className="swatch-divider">
              <span className="arrow">➔</span>
              <span className="diff-tag">
                Diff: {Math.abs(modifiedR - pixelR)}
              </span>
            </div>

            <div className="swatch-card">
              <span className="swatch-title">Modified Pixel (Carrier)</span>
              <div
                className="color-box"
                style={{ backgroundColor: `rgb(${modifiedR}, 100, 180)` }}
              />
              <p className="mono">rgb({modifiedR}, 100, 180)</p>
              <p className="note">Bit {bitIndex}: <strong>{payloadBit}</strong> (Injected)</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE PIPELINE */}
      <section id="pipeline" className="panel study-section">
        <h2>3. The Bitwise Embedding & Extraction Pipeline</h2>
        <p>
          How does text like <span className="mono">&quot;HELLO&quot;</span> actually travel into pixels?
          Here is the exact mathematical pipeline implemented in <span className="mono">lib/stego/lsb.ts</span>:
        </p>

        <div className="pipeline-steps">
          <div className="pipe-step">
            <span className="step-num">Step 1</span>
            <h4>Serialize Text to Binary Stream</h4>
            <p>Every character is represented by UTF-8 bytes. Each byte is expanded into 8 individual bits:</p>
            <div className="code-card">
              <span className="char-badge">&apos;{sampleChar}&apos;</span>
              <span className="arrow">➔</span>
              <span className="mono">ASCII {charCode}</span>
              <span className="arrow">➔</span>
              <span className="mono binary-bits">
                {binaryString.split("").map((b, i) => (
                  <span key={i} className="bit-pill">{b}</span>
                ))}
              </span>
            </div>
            <p className="note" style={{ marginTop: "6px" }}>
              Try entering another character:{" "}
              <input
                type="text"
                maxLength={1}
                value={sampleChar}
                onChange={(e) => setSampleChar(e.target.value.slice(-1) || "A")}
                style={{ width: "3.5em", display: "inline-block", textAlign: "center", fontWeight: "bold" }}
              />
            </p>
          </div>

          <div className="pipe-step">
            <span className="step-num">Step 2</span>
            <h4>Bit Masking (Clearing & Setting)</h4>
            <p>To safely write a payload bit into pixel channel byte <span className="mono">px</span> without altering the other 7 bits:</p>
            <pre className="mono">
{`// 1. Create a clear mask (e.g. for plane 1: ~(1 << 0) = 11111110)
const bit = plane - 1;
const clearMask = ~(1 << bit) & 0xff;

// 2. Clear the target bit, then OR with the new payload bit
px[idx] = (px[idx] & clearMask) | (payloadBit << bit);`}
            </pre>
          </div>

          <div className="pipe-step">
            <span className="step-num">Step 3</span>
            <h4>Reconstructing Bytes during Extraction</h4>
            <p>When extracting, the reader reads the chosen bit from each sequential pixel and shifts it into an accumulator:</p>
            <pre className="mono">
{`// Read one bit from the target plane
const b = (pixels[idx] >> bit) & 1;

// Reconstruct 8 bits into a byte (MSB-first):
byte = (byte << 1) | b;`}
            </pre>
          </div>
        </div>
      </section>

      {/* SECTION 4: BIT PLANES & SLICING */}
      <section id="bitplanes" className="panel study-section">
        <h2>4. Bit Planes & Slicing</h2>
        <p>
          An 8-bit grayscale image or color channel can be visualized as <strong>8 parallel 1-bit planes</strong>,
          where plane 1 contains the 1st bit of each pixel, and plane 8 contains the 8th bit:
        </p>

        <div className="plane-slice-diagram">
          <div className="plane-slice plane-8">
            <span className="slice-name">Plane 8 (MSB)</span>
            <span className="slice-desc">High contrast, sharp silhouettes, broad luminance</span>
          </div>
          <div className="plane-slice plane-6">
            <span className="slice-name">Planes 4–7</span>
            <span className="slice-desc">Progressive topographic contours, shading bands</span>
          </div>
          <div className="plane-slice plane-2">
            <span className="slice-name">Planes 2–3</span>
            <span className="slice-desc">Very delicate gradients, contour line density</span>
          </div>
          <div className="plane-slice plane-1 highlight">
            <span className="slice-name">Plane 1 (LSB)</span>
            <span className="slice-desc">High-frequency dither / invisible noise</span>
          </div>
        </div>

        <p>
          In <Link href="/play">StegGame</Link>, the <strong>Bit Plane Viewer</strong> extracts and displays any one of these 8 planes
          in isolation as pure black ($0$) and white ($255$) pixels. This transforms invisible bit-level changes into obvious visual shapes!
        </p>
      </section>

      {/* SECTION 5: VARIABLES IN THE ENGINE */}
      <section id="variables" className="panel study-section">
        <h2>5. Extraction Variables (The Cryptographic Locks)</h2>
        <p>
          In real steganography, data is not always written in simple left-to-right LSB order.
          To crack hidden transmissions, agents must align four critical parameters:
        </p>

        <div className="variables-grid">
          <div className="var-card">
            <h4>1. Target Bit Plane (1–8)</h4>
            <p>
              Which bit layer holds the payload. Mission 1 uses Plane 1, Mission 2 hides in Plane 3,
              and Mission 3 hides in Plane 2.
            </p>
          </div>

          <div className="var-card">
            <h4>2. Carrier Channels (R, G, B)</h4>
            <p>
              Data can be hidden in one channel (e.g. Green only) or interleaved across multiple channels
              (e.g. Red & Blue alternating pixel by pixel).
            </p>
          </div>

          <div className="var-card">
            <h4>3. Scan Direction (Row vs Column)</h4>
            <p>
              <strong>Row-by-Row:</strong> Left to right, moving down line by line (standard raster).
              <br />
              <strong>Column-by-Column:</strong> Top to bottom down each column, moving right (creates vertical noise stripes).
            </p>
          </div>

          <div className="var-card">
            <h4>4. Bit Order (MSB-first vs LSB-first)</h4>
            <p>
              Whether bits of each byte are placed highest-bit-first (<span className="mono">0b10000000</span>)
              or lowest-bit-first (<span className="mono">0b00000001</span>).
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: FORENSIC STEGANALYSIS */}
      <section id="detection" className="panel study-section">
        <h2>6. Forensic Steganalysis: How Payload is Detected</h2>
        <p>
          How does the <strong>Anomaly Radar</strong> detect hidden payloads without knowing the password?
        </p>

        <div className="compare" style={{ marginTop: "14px" }}>
          <div className="study-card">
            <h4>Natural Pixel Correlation</h4>
            <p className="note">
              In real photos and smooth gradients, neighboring pixels almost always have similar colors:
            </p>
            <pre className="mono">P(bit[x] ≠ bit[x+1]) ≈ 0.05 – 0.20</pre>
            <p className="note">Adjacent bit transitions are rare, forming smooth continuous contour lines.</p>
          </div>

          <div className="study-card" style={{ borderColor: "var(--alert)", background: "#fff5f5" }}>
            <h4>Steganographic Payload Noise</h4>
            <p className="note">
              Encrypted, compressed, or random payload bytes have high Shannon entropy:
            </p>
            <pre className="mono">P(bit[x] ≠ bit[x+1]) ≈ 0.48 – 0.50</pre>
            <p className="note">Bits behave like a coin toss (~50% transitions), appearing as TV static with a sharp boundary!</p>
          </div>
        </div>

        <p style={{ marginTop: "16px" }}>
          By dividing each channel into spatial test strips, the Anomaly Radar calculates the exact
          peak transition rate. If a channel hits ~50%, an artificial payload is flagged instantly!
        </p>
      </section>

      {/* ACTION CTA */}
      <div className="study-cta">
        <h2>Ready to put the theory to the test?</h2>
        <p className="note">Jump into the active field operations and crack hidden messages using the techniques above.</p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "12px" }}>
          <Link href="/play" className="btn primary">
            Start Mission 1
          </Link>
          <Link href="/leaderboard" className="btn">
            View Leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}

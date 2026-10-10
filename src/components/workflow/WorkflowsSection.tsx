import React from 'react';
import './WorkflowsSection.css';

import image1 from '../../assets/workflow/image1.jpeg';
import image2 from '../../assets/workflow/image2.jpeg';
import image3 from '../../assets/workflow/image3.jpeg';
import image4 from '../../assets/workflow/image4.jpeg';
import image5 from '../../assets/workflow/image5.jpeg';
import image6 from '../../assets/workflow/image6.jpeg';
import image7 from '../../assets/workflow/image7.jpeg';
import image8 from '../../assets/workflow/image8.jpeg';

export const WorkflowsSection: React.FC = () => {
  return (
    <div className="workflows-section">
      {/* ── Section Header ── */}
      <header className="workflows-header">
        <div className="workflows-eyebrow">◈ END-TO-END TRUST</div>
        <h2>HOW VERIPROOF WORKS</h2>
        <p>
          One connected ecosystem for issuing, protecting, tracking, scanning,
          authenticating, verifying, and proving documents.
        </p>
      </header>

      {/* ── Dual Workflow Grid ── */}
      <div className="workflow-grid" aria-label="VeriProof issuer and verifier workflows">
        {/* ════════ COLUMN 1: ISSUER FLOW ════════ */}
        <div className="workflow-column workflow-column--issuer">
          <div className="workflow-label">
            <span>ISSUER</span>
            <i aria-hidden="true"></i>
          </div>

          <div className="flow-body">
            <div className="flow-glow glow-1" />
            <div className="flow-glow glow-2" />

            <div className="flow-header">
              <div className="flow-eyebrow">◈ ISSUER JOURNEY</div>
              <h3 className="flow-title">
                From <span>Upload</span> to Trusted Document
              </h3>
              <p className="flow-intro">
                Issue, protect and share thousands of authentic digital documents through one secure workflow.
              </p>
            </div>

            <div className="timeline">
              {/* STEP 1 */}
              <article className="step">
                <div className="number">01</div>
                <div className="line" />

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="step-label">STEP 01</div>
                    <h4 className="step-title"><span>Login</span> to Dashboard</h4>
                    <p>
                      Access your issuer account after Super Admin approval using secure authentication.
                    </p>

                    <div className="features">
                      <div className="feature"><b>✓</b> Secure Login</div>
                      <div className="feature"><b>✓</b> Role-Based Access</div>
                      <div className="feature"><b>✓</b> 2FA Authentication</div>
                    </div>
                  </div>

                  <div className="visual login-visual" aria-label="Issuer login reference image">
                    <img className="reference-image" src={image1} alt="Issuer login reference image" />
                    <div className="visual-caption"><span /> Secure issuer access</div>
                  </div>
                </div>
              </article>

              {/* STEP 2 */}
              <article className="step">
                <div className="number">02</div>
                <div className="line" />

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="step-label">STEP 02</div>
                    <h4 className="step-title"><span>Upload</span> Documents</h4>
                    <p>
                      Upload one or thousands of documents together using bulk upload with required metadata.
                    </p>

                    <div className="features">
                      <div className="feature"><b>✓</b> Bulk Upload</div>
                      <div className="feature"><b>✓</b> ZIP / CSV Support</div>
                      <div className="feature"><b>✓</b> Thousands of Documents</div>
                    </div>
                  </div>

                  <div className="visual upload-visual" aria-label="Bulk document upload reference image">
                    <img className="upload-reference-image" src={image2} alt="Bulk document upload reference image" />
                    <div className="visual-caption"><span /> Bulk intake ready</div>
                  </div>
                </div>
              </article>

              {/* STEP 3 */}
              <article className="step">
                <div className="number">03</div>
                <div className="line" />

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="step-label">STEP 03</div>
                    <h4 className="step-title"><span>Automatic</span> Protection</h4>
                    <p>
                      VeriProof automatically protects every document with cryptographic verification and a unique identity.
                    </p>

                    <div className="features">
                      <div className="feature"><b>✓</b> SHA-256 Hash</div>
                      <div className="feature"><b>✓</b> ECDSA Digital Signature</div>
                      <div className="feature"><b>✓</b> Unique Document ID</div>
                      <div className="feature"><b>✓</b> QR Code Generation</div>
                    </div>
                  </div>

                  <div className="visual security-visual" aria-label="Digital document protection reference image">
                    <img className="security-reference-image" src={image3} alt="Digital document protection reference image" />
                    <div className="visual-caption"><span /> Cryptographic protection</div>
                  </div>
                </div>
              </article>

              {/* STEP 4 */}
              <article className="step">
                <div className="number">04</div>

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="step-label">STEP 04</div>
                    <h4 className="step-title"><span>Track</span> & Control</h4>
                    <p>
                      Monitor issued documents, track verification activity, manage document status, and revoke credentials whenever necessary.
                    </p>

                    <div className="features">
                      <div className="feature"><b>✓</b> Document Status — Active / Revoked / Expired</div>
                      <div className="feature"><b>✓</b> Verification Tracking — Monitor verification activity</div>
                      <div className="feature"><b>✓</b> Revoke Credential — Instantly revoke compromised or invalid documents</div>
                      <div className="feature"><b>✓</b> Audit Trail — View complete document activity history</div>
                    </div>
                  </div>

                  <div className="visual track-visual" aria-label="Document activity and verification tracking reference image">
                    <img className="track-reference-image" src={image4} alt="Document activity and verification tracking reference image" />
                    <div className="visual-caption"><span /> Status & audit control</div>
                  </div>
                </div>
              </article>
            </div>

            <div className="bottom">
              <div className="bottom-icon">↗</div>
              <strong>One workflow. Thousands of trusted documents.</strong>
              <small>Hash • Sign • Identify • Verify • Share • Track</small>
            </div>
          </div>
        </div>

        {/* ════════ DIVIDER ════════ */}
        <div className="workflow-divider" aria-hidden="true" />

        {/* ════════ COLUMN 2: VERIFIER FLOW ════════ */}
        <div className="workflow-column workflow-column--verifier">
          <div className="workflow-label">
            <span>VERIFIER</span>
            <i aria-hidden="true"></i>
          </div>

          <div className="flow-body">
            <div className="flow-glow g1" />
            <div className="flow-glow g2" />

            <div className="flow-header">
              <div className="flow-eyebrow">◈ VERIFIER JOURNEY</div>
              <h3 className="flow-title">
                From <span>Scan</span> to Trusted Verdict
              </h3>
              <p className="flow-intro">
                Verify digital credentials through cryptographic proof, issuer authentication and evidence-backed document analysis.
              </p>
            </div>

            <div className="timeline">
              {/* STEP 1 */}
              <article className="step">
                <div className="number">01</div>
                <div className="line" />

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="verifier-label">STEP 01</div>
                    <h4 className="step-title"><span>Scan</span> / Upload</h4>
                    <p>
                      Scan the document QR code or upload a PDF/image to start secure verification.
                    </p>

                    <div className="verifier-features">
                      <div>✓ QR Code Scan</div>
                      <div>✓ PDF / Image Upload</div>
                      <div>✓ Document ID Detection</div>
                      <div>✓ Secure Submission</div>
                    </div>
                  </div>

                  <div className="visual">
                    <img className="reference-image" src={image5} alt="Verify document scan or upload reference" />
                  </div>
                </div>
              </article>

              {/* STEP 2 */}
              <article className="step">
                <div className="number">02</div>
                <div className="line" />

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="verifier-label">STEP 02</div>
                    <h4 className="step-title"><span>Access</span> & Identity Check</h4>
                    <p>
                      VeriProof identifies the issuer, retrieves the trusted registry record and checks verifier authorization.
                    </p>

                    <div className="verifier-features">
                      <div>✓ Issuer Authentication</div>
                      <div>✓ Registry Lookup</div>
                      <div>✓ Access Permission</div>
                      <div>✓ Document Status</div>
                    </div>
                  </div>

                  <div className="visual">
                    <img className="reference-image" src={image6} alt="Trusted issuer verification reference" />
                  </div>
                </div>
              </article>

              {/* STEP 3 */}
              <article className="step">
                <div className="number">03</div>
                <div className="line" />

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="verifier-label">STEP 03</div>
                    <h4 className="step-title"><span>Multi-Layer</span> Verification</h4>
                    <p>
                      Multiple verification layers compare the submitted document against the trusted issuer record and detect tampering or suspicious alterations.
                    </p>

                    <div className="verifier-features">
                      <div>✓ SHA-256 Hash</div>
                      <div>✓ ECDSA Signature</div>
                      <div>✓ OCR Field Matching</div>
                      <div>✓ Metadata & Visual Forensics</div>
                    </div>
                  </div>

                  <div className="visual">
                    <img className="reference-image" src={image7} alt="Verification engine reference" />
                  </div>
                </div>
              </article>

              {/* STEP 4 */}
              <article className="step">
                <div className="number">04</div>

                <div className="flow-card">
                  <div className="flow-content">
                    <div className="verifier-label">STEP 04</div>
                    <h4 className="step-title"><span>Result</span> & Evidence</h4>
                    <p>
                      Receive an explainable verdict with TrustScore, detected evidence, reasons and a downloadable verification report.
                    </p>

                    <div className="verifier-features">
                      <div>✓ Verified / Tampered / Unverified</div>
                      <div>✓ TrustScore</div>
                      <div>✓ Evidence & Reasons</div>
                      <div>✓ Verification Report</div>
                    </div>
                  </div>

                  <div className="visual">
                    <img className="reference-image" src={image8} alt="Verification result reference" />
                  </div>
                </div>
              </article>
            </div>

            <div className="bottom">
              <div className="bottom-check">✓</div>
              <b>Don't just trust the document. Verify the proof.</b>
              <small>Scan • Authenticate • Analyze • Prove</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsSection;

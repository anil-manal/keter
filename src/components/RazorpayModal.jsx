import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  Loader2,
  Tag,
  Sparkles,
} from 'lucide-react';
import {
  initiateRazorpayCheckout,
  getRazorpayKey,
  saveRazorpayKey,
  isValidRazorpayKey,
  validateVoucher,
  OFFICIAL_VOUCHER_CODE,
} from '../services/paymentService';
import { PROJECT_COST_INR } from '../services/projectService';

export function RazorpayModal({
  isOpen,
  onClose,
  userProfile,
  onPaymentSuccess,
}) {
  if (!isOpen) return null;

  const [projectTitle, setProjectTitle] = useState('Interview Session');
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [noticeMessage, setNoticeMessage] = useState(null);

  // Voucher / Promo Code State (Configured in .env, defaults to ANIL for 100% OFF)
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState(null);

  const discountPercent = appliedVoucher ? appliedVoucher.discountPercent : 0;
  const is100PercentOff = discountPercent === 100;
  const finalAmount = is100PercentOff ? 0 : Math.max(0, Math.round(PROJECT_COST_INR * (1 - discountPercent / 100)));

  // Active Razorpay Merchant Key (Pre-configured with live merchant key)
  const [activeKey, setActiveKey] = useState(() => getRazorpayKey());

  useEffect(() => {
    const key = getRazorpayKey();
    if (key) {
      setActiveKey(key);
    }
  }, []);

  const handleApplyVoucher = (e) => {
    if (e) e.preventDefault();
    setVoucherError(null);
    const valid = validateVoucher(voucherInput);
    if (valid) {
      setAppliedVoucher(valid);
      setVoucherError(null);
      setNoticeMessage({
        type: 'success',
        text: `🎉 Voucher "${valid.code}" applied! 100% discount activated (Pass is completely FREE).`,
      });
    } else {
      setVoucherError('Invalid promo or voucher code. Please check and try again.');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
    setNoticeMessage(null);
  };

  const handlePay = async () => {
    setIsProcessing(true);
    setNoticeMessage(null);

    // 100% OFF Voucher bypasses Razorpay gateway completely!
    if (is100PercentOff) {
      setTimeout(() => {
        const freePaymentId = `voucher_${appliedVoucher.code.toLowerCase()}_${Date.now()}`;
        finishPayment(freePaymentId, 0);
      }, 700);
      return;
    }

    try {
      await initiateRazorpayCheckout({
        amount: finalAmount,
        projectTitle: projectTitle.trim() || 'Interview Session',
        userProfile,
        onSuccess: (data) => {
          if (data && data.paymentId) {
            finishPayment(data.paymentId, finalAmount);
          } else {
            setIsProcessing(false);
            setNoticeMessage({
              type: 'error',
              text: 'Payment received but did not return a valid transaction ID. Please check your bank statement.',
            });
          }
        },
        onDismiss: () => {
          // Candidate dismissed or closed the Razorpay popup
          // DO NOT create project, DO NOT charge, DO NOT simulate
          setIsProcessing(false);
          setNoticeMessage({
            type: 'info',
            text: 'Payment was dismissed. No pass was purchased.',
          });
        },
        onFailure: (err) => {
          // Real transaction failure
          console.warn('[Razorpay Payment Failed]:', err);
          setIsProcessing(false);
          setNoticeMessage({
            type: 'error',
            text: typeof err === 'string' ? err : 'Payment could not be completed. Please try again.',
          });
        },
      });
    } catch (err) {
      console.error('[Razorpay Error]:', err);
      setIsProcessing(false);
      setNoticeMessage({
        type: 'error',
        text: err.message || 'Razorpay checkout encountered an issue.',
      });
    }
  };

  const finishPayment = (paymentId, amountPaid = PROJECT_COST_INR) => {
    setIsProcessing(false);
    setIsSuccess(true);
    const resultData = {
      title: projectTitle.trim() || 'Interview Session',
      targetRole: targetRole.trim() || 'Software Engineer',
      paymentId,
      paidAmount: amountPaid,
      voucherApplied: appliedVoucher ? appliedVoucher.code : null,
    };
    setPaymentResult(resultData);

    setTimeout(() => {
      onPaymentSuccess(resultData);
      onClose();
    }, 1500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="no-drag"
        style={{
          backgroundColor: '#0c101c',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px rgba(56, 189, 248, 0.2)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <Zap size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                Buy Interview Project Pass
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={12} color="#34d399" />
                <span>Instant 24-Hour Pass</span>
                <span>•</span>
                <span style={{ color: '#38bdf8' }}>Official UPI & Cards</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div style={{ padding: '36px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                border: '2px solid rgba(34, 197, 94, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              Payment of ₹{PROJECT_COST_INR} Confirmed!
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.5 }}>
              Your 24-hour pass for <strong>"{paymentResult?.title}"</strong> has been created in <strong>Inactive</strong> mode. You can configure your JD & Resume now, and hit <em>"Activate"</em> when your interview begins.
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '4px 10px',
                borderRadius: '6px',
              }}
            >
              Razorpay ID: {paymentResult?.paymentId}
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Price & Plan Hero Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(147, 51, 234, 0.15) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '16px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 7px',
                    borderRadius: '6px',
                  }}
                >
                  PER-PROJECT PASS
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '6px' }}>
                  1x Interview Project Session
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '3px' }}>
                  Includes Screen OCR, Audio Loopback, JD Context & Full Multi-turn Memory.
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {is100PercentOff ? (
                  <div>
                    <div style={{ fontSize: '13px', textDecoration: 'line-through', color: '#94a3b8' }}>
                      ₹{PROJECT_COST_INR}
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#4ade80' }}>
                      ₹0 FREE
                    </div>
                    <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: 800 }}>
                      VOUCHER: {appliedVoucher.code} (100% OFF)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8' }}>
                      ₹{PROJECT_COST_INR}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      One-time (Incl. GST)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CRITICAL NOTICE: Unactivated Lifecycle Rule */}
            <div
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <Clock size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#fde68a', lineHeight: 1.45 }}>
                <strong>Not Activated Immediately:</strong> This project is created in <em>Inactive</em> state.
                <div style={{ marginTop: '4px', color: '#fef3c7' }}>
                  ⚠️ <strong>Rule:</strong> The 24-hour timer starts ONLY when you click <em>"Activate Session"</em>. Once activated, it <strong>cannot be paused or deactivated</strong> and strictly expires after 24 hours.
                </div>
              </div>
            </div>

            {/* Project Details Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                  Interview Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Google L5 Frontend Interview"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                  Target Position / Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>





            {/* Voucher / Promo Code Section */}
            <div
              style={{
                backgroundColor: appliedVoucher ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                border: appliedVoucher ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} color={appliedVoucher ? '#34d399' : '#38bdf8'} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: appliedVoucher ? '#34d399' : '#f8fafc' }}>
                    {appliedVoucher ? 'Voucher Applied' : 'Have a Promo / Voucher Code?'}
                  </span>
                </div>
                {appliedVoucher && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      color: '#4ade80',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    100% OFF • UNLIMITED
                  </span>
                )}
              </div>

              {appliedVoucher ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                        Voucher "{appliedVoucher.code}" Active
                      </div>
                      <div style={{ fontSize: '10px', color: '#86efac' }}>
                        100% Discount Applied. ₹{PROJECT_COST_INR} &rarr; ₹0 (FREE PASS).
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveVoucher}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleApplyVoucher}
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => {
                      setVoucherInput(e.target.value);
                      if (voucherError) setVoucherError(null);
                    }}
                    placeholder="Enter promo code"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: voucherError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.2)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Apply Code
                  </button>
                </form>
              )}

              {voucherError && (
                <div style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span>⚠️</span>
                  <span>{voucherError}</span>
                </div>
              )}
            </div>

            {/* Notice / Error Message Banner */}
            {noticeMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  lineHeight: 1.4,
                  backgroundColor: noticeMessage.type === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : noticeMessage.type === 'success'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  border: noticeMessage.type === 'error'
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : noticeMessage.type === 'success'
                    ? '1px solid rgba(34, 197, 94, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
                  color: noticeMessage.type === 'error'
                    ? '#fca5a5'
                    : noticeMessage.type === 'success'
                    ? '#86efac'
                    : '#fde68a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>{noticeMessage.type === 'error' ? '⚠️' : noticeMessage.type === 'success' ? '✨' : 'ℹ️'}</span>
                <span>{noticeMessage.text}</span>
              </div>
            )}

            {/* Claim / Pay Button */}
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                backgroundColor: isProcessing
                  ? (is100PercentOff ? '#059669' : '#0284c7')
                  : (is100PercentOff ? '#10b981' : '#0ea5e9'),
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isProcessing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: is100PercentOff
                  ? '0 4px 20px rgba(16, 185, 129, 0.45)'
                  : '0 4px 16px rgba(14, 165, 233, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="spin" />
                  <span>
                    {is100PercentOff ? 'Activating 100% Free Pass...' : `Processing Razorpay Payment (₹${finalAmount})...`}
                  </span>
                </>
              ) : is100PercentOff ? (
                <>
                  <Sparkles size={16} color="#ffffff" />
                  <span>Claim 100% Free Pass (₹0 with Voucher {appliedVoucher.code})</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Pay ₹{finalAmount} with Razorpay</span>
                </>
              )}
            </button>

            {/* Trust Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                fontSize: '11px',
                color: '#64748b',
                textAlign: 'center',
              }}
            >
              <span>🔒 256-bit SSL</span>
              <span>•</span>
              <span>PCI-DSS Level 1</span>
              <span>•</span>
              <span>Instant Pass Activation Ready</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

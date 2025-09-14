// src/components/SuccessModal.js
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react"; // ✅ Add error icon
import "./SuccessModal.css";

export default function SuccessModal({ message, onClose, isOpen, type = "success" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="modal-card"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="modal-icon">
              {type === "success" ? (
                <CheckCircle2 size={56} color="#2ecc71" />
              ) : (
                <XCircle size={56} color="#e74c3c" />
              )}
            </div>
            <h2 className="modal-title">
              {type === "success" ? "Success" : "Error"}
            </h2>
            <p className="modal-message">{message}</p>
            <button className="modal-button" onClick={onClose}>
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// src/components/ConfirmModal.js
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { XCircle } from "lucide-react";
import "./SuccessModal.css"; // reuse styles, override some if needed

export default function ConfirmModal({ message, onConfirm, onCancel, isOpen }) {
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
              <XCircle size={56} color="#e74c3c" />
            </div>
            <h2 className="modal-title" style={{ color: "#e74c3c" }}>
              Confirm Delete
            </h2>
            <p className="modal-message">{message}</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button
                className="modal-button"
                style={{ background: "#e74c3c" }}
                onClick={onConfirm}
              >
                Delete
              </button>
              <button
                className="modal-button"
                style={{ background: "#bdc3c7", color: "#333" }}
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

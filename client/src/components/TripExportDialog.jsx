import React, { useRef, useEffect, useState } from 'react';
import { FiDownload, FiPrinter, FiX } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import './TripExportDialog.css';
import { useTheme } from '../context/ThemeContext';
import { createPortal } from 'react-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TripPDFDocument from './TripPDFDocument';
import { useTranslation } from 'react-i18next';

const TripExportDialog = ({ trip, onClose }) => {
  const printRef = useRef();
  const { theme } = useTheme();
  const [printReady, setPrintReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Set printReady to true after the component and portal are mounted
    setPrintReady(true);
    return () => setPrintReady(false);
  }, []);

  // Format date to a readable string
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle print functionality
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .no-print { display: none; }
        .print-section { padding: 20px; }
      }
    `,
  });

  // Handle CSV export
  const handleExportCSV = () => {
    if (!trip) return;

    let csvContent = 'Day,Time,Activity,Description,Location\n';

    trip.days.forEach((day, dayIndex) => {
      day.activities.forEach((activity) => {
        const row = [
          `Day ${dayIndex + 1}`,
          activity.time || 'All Day',
          `"${activity.title || ''}"`,
          `"${activity.description || ''}"`,
          `"${activity.location || ''}"`,
        ];
        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `trip_${trip.title.replace(/\s+/g, '_').toLowerCase()}_itinerary.csv`);
  };

  const themeClass = theme === 'dark' ? 'dark-theme' : '';
  return (
    <>
      <div className={`export-dialog-overlay ${themeClass}`}>
        <div
          className={`export-dialog ${themeClass}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-dialog-title"
        >
          <div className="export-dialog-header">
            <div className="header-content">
              <h2 id="export-dialog-title">{t('tripExportDialog.title')}</h2>
            </div>
            <button
              className="close-button"
              onClick={onClose}
              aria-label={t('tripExportDialog.closeDialog')}
            >
              <FiX size={24} />
            </button>
          </div>
          <div className="export-dialog-content">
            <div className="export-options">
              <PDFDownloadLink
                document={<TripPDFDocument trip={trip} t={t} />}
                fileName={`trip_${trip?.title?.replace(/\s+/g, '_').toLowerCase()}_itinerary.pdf`}
                className="export-button"
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) => (
                  <>
                    <FiDownload size={20} />
                    <span>
                      {loading
                        ? t('tripExportDialog.preparingPDF')
                        : t('tripExportDialog.exportAsPDF')}
                    </span>
                  </>
                )}
              </PDFDownloadLink>
              <button className="export-button" onClick={handleExportCSV} disabled={!trip}>
                <FiDownload size={20} />
                <span>{t('tripExportDialog.exportAsCSV')}</span>
              </button>
              <button
                className="export-button"
                onClick={handlePrint}
                disabled={!printReady || !trip}
              >
                <FiPrinter size={20} />
                <span>{t('tripExportDialog.printItinerary')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {createPortal(
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-9999px',
            width: '210mm',
            background: '#fff',
            color: '#000',
            zIndex: -1,
          }}
        >
          <div ref={printRef} className="print-section">
            {trip ? (
              <>
                <h1>{trip.title}</h1>
                <p>{trip.description}</p>
                <p>
                  <strong>{t('tripExportDialog.duration')}:</strong> {formatDate(trip.startDate)}{' '}
                  {t('tripExportDialog.to')} {formatDate(trip.endDate)}
                </p>
                <h2>{t('tripExportDialog.itinerary')}</h2>
                {trip.days?.map((day, dayIndex) => (
                  <div key={day._id || dayIndex} className="day-section">
                    <h3>
                      {t('tripExportDialog.day', { number: dayIndex + 1 })}: {formatDate(day.date)}
                    </h3>
                    <div className="activities-list">
                      {day.activities?.map((activity, activityIndex) => (
                        <div key={activity._id || activityIndex} className="activity-item">
                          <div className="activity-time">
                            {activity.time || t('tripExportDialog.allDay')}
                          </div>
                          <div className="activity-details">
                            <h4>{activity.title}</h4>
                            {activity.description && <p>{activity.description}</p>}
                            {activity.location && (
                              <div className="activity-location">
                                📍 {t('tripExportDialog.location')}: {activity.location}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TripExportDialog;

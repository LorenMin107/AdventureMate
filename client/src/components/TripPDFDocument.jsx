import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    padding: 32,
    backgroundColor: '#fff',
    color: '#222',
    lineHeight: 1.5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1a1a1a',
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
    color: '#444',
  },
  duration: {
    fontSize: 11,
    marginBottom: 12,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
    color: '#1976d2',
  },
  daySection: {
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: '1px solid #eee',
  },
  dayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  activityItem: {
    marginBottom: 4,
    paddingLeft: 6,
    borderLeft: '2px solid #e0e0e0',
  },
  activityTime: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#1976d2',
    marginBottom: 1,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 1,
    color: '#222',
  },
  activityDesc: {
    fontSize: 10,
    color: '#444',
    marginBottom: 1,
  },
  activityLocation: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
  },
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const TripPDFDocument = ({ trip, t }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{trip?.title || t('tripPDF.tripItinerary')}</Text>
      {trip?.description && <Text style={styles.description}>{trip.description}</Text>}
      {trip?.startDate && trip?.endDate && (
        <Text style={styles.duration}>
          {t('tripPDF.duration')}: {formatDate(trip.startDate)} to {formatDate(trip.endDate)}
        </Text>
      )}
      <Text style={styles.sectionTitle}>{t('tripPDF.itinerary')}</Text>
      {trip?.days?.map((day, dayIndex) => (
        <View key={day._id || dayIndex} style={styles.daySection}>
          <Text style={styles.dayTitle}>
            {t('tripPDF.day')} {dayIndex + 1}: {formatDate(day.date)}
          </Text>
          {day.activities?.map((activity, activityIndex) => (
            <View key={activity._id || activityIndex} style={styles.activityItem}>
              <Text style={styles.activityTime}>{activity.time || t('tripPDF.allDay')}</Text>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              {activity.description && (
                <Text style={styles.activityDesc}>{activity.description}</Text>
              )}
              {activity.location && (
                <Text style={styles.activityLocation}>{activity.location}</Text>
              )}
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);

export default TripPDFDocument;

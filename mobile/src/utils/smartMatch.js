const CAN_DONATE_TO = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

const BLOOD_ORDER = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const compatibleRecipients = (bloodGroup) => CAN_DONATE_TO[bloodGroup] || [];

export const groupsThatCanDonateTo = (bloodGroup) =>
  BLOOD_ORDER.filter((group) => (CAN_DONATE_TO[group] || []).includes(bloodGroup));

const hospitalKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/hospital/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sameHospital = (requestHospital, donorHospital) => {
  const requestKey = hospitalKey(requestHospital);
  const donorKey = hospitalKey(donorHospital);
  if (requestKey.length < 4 || donorKey.length < 4) {
    return false;
  }
  return requestKey.includes(donorKey) || donorKey.includes(requestKey);
};

const buildReason = ({ donor, wanted, exact, matchedHospital, urgency, distance }) => {
  const distanceText = `${distance.toFixed(1)} km away`;
  const availabilityText = donor.available ? 'available to donate now' : 'not available right now';
  const bloodText = exact
    ? `an exact ${wanted} blood match`
    : `${donor.bloodGroup} blood, which can be given to ${wanted} patients`;
  const hospitalText = matchedHospital ? ` They are also linked to ${donor.hospital}, the hospital in this request.` : '';
  const urgencyText =
    urgency === 'Critical' || urgency === 'High'
      ? ` Nearby donors were weighted higher because this request is ${urgency.toLowerCase()}.`
      : '';

  return `Selected for ${bloodText}, ${availabilityText}, and ${distanceText}.${hospitalText}${urgencyText}`;
};

export const rankDonorsForRequest = ({ donors, bloodGroup, hospital, urgency }) => {
  const wanted = String(bloodGroup || '').toUpperCase();

  return donors
    .map((donor) => {
      const exact = donor.bloodGroup === wanted;
      const compatible = exact || (CAN_DONATE_TO[donor.bloodGroup] || []).includes(wanted);
      if (!compatible) {
        return null;
      }

      const distance = Number(donor.distanceKm) || 12;
      const distanceScore = Math.max(0, 22 * (1 - Math.min(distance, 12) / 12));
      const matchedHospital = sameHospital(hospital, donor.hospital);
      const urgent = urgency === 'Critical' || urgency === 'High';
      const score = Math.min(
        99,
        Math.round(
          (exact ? 46 : 30) +
            distanceScore +
            (donor.available ? 24 : 0) +
            (matchedHospital ? 8 : 0) +
            (urgent && distance <= 5 ? 4 : 0)
        )
      );

      return {
        ...donor,
        score,
        exact,
        matchedHospital,
        reason: buildReason({
          donor,
          wanted,
          exact,
          matchedHospital,
          urgency,
          distance,
        }),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score || left.distanceKm - right.distanceKm)
    .slice(0, 3);
};

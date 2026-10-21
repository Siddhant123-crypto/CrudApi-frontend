export const formatAddedTime = (createdOn?: string, addedTime?: string): string | null => {
  if (!createdOn && !addedTime) return null;

  let dateStr = '';
  let timeStr = '';

  try {
    if (createdOn) {
      const dateObj = new Date(createdOn);
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[dateObj.getMonth()];
        const year = dateObj.getFullYear();
        dateStr = `${day} ${month} ${year}`;

        // Fallback for time if addedTime is missing
        if (!addedTime) {
          let hours = dateObj.getHours();
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
          timeStr = strTime;
        }
      }
    }

    if (addedTime) {
      // addedTime might be "14:17:52.4633526"
      const timeParts = addedTime.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
      }
    }

    if (dateStr && timeStr) {
      return `${dateStr}, ${timeStr}`;
    } else if (dateStr) {
      return dateStr;
    } else if (timeStr) {
      return timeStr;
    }

    return null;
  } catch (error) {
    console.error('Error formatting added time:', error);
    return null;
  }
};

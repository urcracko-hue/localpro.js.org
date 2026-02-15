const professions = [
    { id: 'electrician', name: 'Electrician', icon: '⚡', category: 'Home Services' },
    { id: 'plumber', name: 'Plumber', icon: '🔧', category: 'Home Services' },
    { id: 'carpenter', name: 'Carpenter', icon: '🪚', category: 'Home Services' },
    { id: 'painter', name: 'Painter', icon: '🎨', category: 'Home Services' },
    { id: 'mechanic', name: 'Mechanic', icon: '🔩', category: 'Automotive' },
    { id: 'tutor', name: 'Tutor', icon: '📚', category: 'Education' },
    { id: 'house_cleaner', name: 'House Cleaner', icon: '🧹', category: 'Home Services' },
    { id: 'gardener', name: 'Gardener', icon: '🌱', category: 'Home Services' },
    { id: 'ac_technician', name: 'AC Technician', icon: '❄️', category: 'Home Services' },
    { id: 'appliance_repair', name: 'Appliance Repair', icon: '🔌', category: 'Home Services' },
    { id: 'driver', name: 'Driver', icon: '🚗', category: 'Transportation' },
    { id: 'cook', name: 'Cook/Chef', icon: '👨‍🍳', category: 'Food & Catering' },
    { id: 'tailor', name: 'Tailor', icon: '🧵', category: 'Fashion' },
    { id: 'photographer', name: 'Photographer', icon: '📷', category: 'Events' },
    { id: 'videographer', name: 'Videographer', icon: '🎥', category: 'Events' },
    { id: 'dj', name: 'DJ', icon: '🎧', category: 'Events' },
    { id: 'event_planner', name: 'Event Planner', icon: '🎉', category: 'Events' },
    { id: 'caterer', name: 'Caterer', icon: '🍽️', category: 'Food & Catering' },
    { id: 'security_guard', name: 'Security Guard', icon: '💂', category: 'Security' },
    { id: 'babysitter', name: 'Babysitter', icon: '👶', category: 'Care Services' },
    { id: 'elder_care', name: 'Elder Care', icon: '👴', category: 'Care Services' },
    { id: 'pet_care', name: 'Pet Care', icon: '🐕', category: 'Care Services' },
    { id: 'fitness_trainer', name: 'Fitness Trainer', icon: '💪', category: 'Health & Fitness' },
    { id: 'yoga_instructor', name: 'Yoga Instructor', icon: '🧘', category: 'Health & Fitness' },
    { id: 'music_teacher', name: 'Music Teacher', icon: '🎵', category: 'Education' },
    { id: 'dance_teacher', name: 'Dance Teacher', icon: '💃', category: 'Education' },
    { id: 'mason', name: 'Mason', icon: '🧱', category: 'Construction' },
    { id: 'welder', name: 'Welder', icon: '🔥', category: 'Construction' },
    { id: 'roofer', name: 'Roofer', icon: '🏠', category: 'Construction' },
    { id: 'tile_installer', name: 'Tile Installer', icon: '🔲', category: 'Construction' },
    { id: 'interior_designer', name: 'Interior Designer', icon: '🛋️', category: 'Design' },
    { id: 'pest_control', name: 'Pest Control', icon: '🐜', category: 'Home Services' },
    { id: 'locksmith', name: 'Locksmith', icon: '🔐', category: 'Home Services' },
    { id: 'movers_packers', name: 'Movers & Packers', icon: '📦', category: 'Transportation' },
    { id: 'computer_repair', name: 'Computer Repair', icon: '💻', category: 'Technology' },
    { id: 'mobile_repair', name: 'Mobile Repair', icon: '📱', category: 'Technology' },
    { id: 'cctv_installer', name: 'CCTV Installer', icon: '📹', category: 'Security' },
    { id: 'beautician', name: 'Beautician', icon: '💅', category: 'Beauty' },
    { id: 'barber', name: 'Barber', icon: '💈', category: 'Beauty' },
    { id: 'makeup_artist', name: 'Makeup Artist', icon: '💄', category: 'Beauty' },
    { id: 'mehendi_artist', name: 'Mehendi Artist', icon: '🖐️', category: 'Beauty' },
    { id: 'astrologer', name: 'Astrologer', icon: '🔮', category: 'Spiritual' },
    { id: 'pandit', name: 'Pandit/Priest', icon: '🙏', category: 'Spiritual' },
    { id: 'lawyer', name: 'Lawyer', icon: '⚖️', category: 'Professional' },
    { id: 'accountant', name: 'CA/Accountant', icon: '📊', category: 'Professional' },
    { id: 'physiotherapist', name: 'Physiotherapist', icon: '🏥', category: 'Health & Fitness' },
    { id: 'nurse', name: 'Home Nurse', icon: '👩‍⚕️', category: 'Health & Fitness' },
    { id: 'laundry', name: 'Laundry Service', icon: '👕', category: 'Home Services' },
    { id: 'car_washer', name: 'Car Washer', icon: '🚿', category: 'Automotive' },
    { id: 'bike_mechanic', name: 'Bike Mechanic', icon: '🏍️', category: 'Automotive' }
];

// Get profession by ID
const getProfessionById = (id) => {
    return professions.find(p => p.id === id) || null;
};

// Get all professions
const getAllProfessions = () => {
    return professions;
};

// Get professions by category
const getProfessionsByCategory = () => {
    const categories = {};
    professions.forEach(p => {
        if (!categories[p.category]) {
            categories[p.category] = [];
        }
        categories[p.category].push(p);
    });
    return categories;
};

module.exports = {
    professions,
    getProfessionById,
    getAllProfessions,
    getProfessionsByCategory
};
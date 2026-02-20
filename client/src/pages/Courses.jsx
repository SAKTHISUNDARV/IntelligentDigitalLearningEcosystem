import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Courses() {
  const navigate = useNavigate();

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const courses = [
    {
      id: 1,
      title: "React Basics",
      desc: "Learn fundamentals of React including hooks, components, and state management",
      level: "Beginner",
      duration: "8 hrs",
      students: 1234,
      rating: 4.8,
      instructor: "John Doe",
      category: "Frontend",
      icon: "⚛️",
    },
    {
      id: 2,
      title: "Python Fundamentals",
      desc: "Start coding with Python from scratch",
      level: "Beginner",
      duration: "10 hrs",
      students: 2341,
      rating: 4.9,
      instructor: "Jane Smith",
      category: "Programming",
      icon: "🐍",
    },
    {
      id: 3,
      title: "Machine Learning",
      desc: "Regression, classification and neural networks",
      level: "Intermediate",
      duration: "15 hrs",
      students: 892,
      rating: 4.7,
      instructor: "Dr. AI Expert",
      category: "AI/ML",
      icon: "🤖",
    },
    {
      id: 4,
      title: "JavaScript Mastery",
      desc: "Advanced JS, closures, async, promises",
      level: "Intermediate",
      duration: "12 hrs",
      students: 1567,
      rating: 4.8,
      instructor: "Mike Wilson",
      category: "Frontend",
      icon: "📜",
    },
    {
      id: 5,
      title: "Data Structures",
      desc: "Essential DSA for interviews",
      level: "Advanced",
      duration: "20 hrs",
      students: 723,
      rating: 4.9,
      instructor: "Sarah Johnson",
      category: "Computer Science",
      icon: "📊",
    },
    {
      id: 6,
      title: "UI/UX Design",
      desc: "Design better user experiences",
      level: "Beginner",
      duration: "8 hrs",
      students: 1056,
      rating: 4.6,
      instructor: "Emily Brown",
      category: "Design",
      icon: "🎨",
    },
  ];

  const categories = [
    "All",
    "Frontend",
    "Programming",
    "AI/ML",
    "Computer Science",
    "Design",
  ];

  const handleEnroll = (id) => {
    if (!enrolledCourses.includes(id)) {
      setEnrolledCourses((prev) => [...prev, id]);
      alert("Enrolled successfully!");
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.desc.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      course.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10">

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Explore Courses
        </h1>
        <p className="text-gray-500 mt-1">
          Learn new skills and grow your career
        </p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search courses..."
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm border
                ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

        {filteredCourses.map((course) => {
          const enrolled = enrolledCourses.includes(course.id);

          return (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col"
            >

              {/* Icon */}
              <div className="text-4xl mb-3">{course.icon}</div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-800">
                {course.title}
              </h2>

              <p className="text-sm text-gray-600 mt-1 flex-grow">
                {course.desc}
              </p>

              {/* Info */}
              <div className="text-sm text-gray-500 mt-3 space-y-1">
                <p>Level: {course.level}</p>
                <p>Duration: {course.duration}</p>
                <p>Rating: ⭐ {course.rating}</p>
              </div>

              {/* Button */}
              <button
                onClick={() => handleEnroll(course.id)}
                disabled={enrolled}
                className={`mt-4 py-2 rounded-lg font-medium transition
                  ${
                    enrolled
                      ? "bg-green-500 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
              >
                {enrolled ? "Enrolled" : "Enroll Now"}
              </button>
            </div>
          );
        })}
      </div>

      {/* My Learning */}
      {enrolledCourses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-12">

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            My Learning
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {courses
              .filter((c) => enrolledCourses.includes(c.id))
              .map((course) => (
                <div
                  key={course.id}
                  className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-500">{course.duration}</p>
                  </div>

                  <button
                    onClick={() => navigate("/my-courses")}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Continue
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyCourses() {
  const myCourses = ["React Basics", "Python Fundamentals"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Registered Courses
      </h1>

      <div className="space-y-4">
        {myCourses.map((course, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center"
          >
            <span className="text-gray-700">{course}</span>

            <button className="text-[#24a0ed] hover:underline">
              Continue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

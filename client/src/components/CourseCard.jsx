export default function CourseCard({ course }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <h2 className="text-xl font-semibold">{course.title}</h2>
      <p className="text-gray-600">{course.description}</p>
      <button className="bg-green-600 text-white mt-3 px-4 py-2 rounded">
        Enroll
      </button>
    </div>
  );
}

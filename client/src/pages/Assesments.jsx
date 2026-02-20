export default function Assessments() {
  const assessments = ["React Quiz", "Python Quiz", "ML Basics Test"];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Take Assessment
      </h1>

      <div className="space-y-4">
        {assessments.map((test, index) => (
          <div
            key={index}
            className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center"
          >
            <span className="text-gray-700">{test}</span>

            <button className="bg-[#24a0ed] text-white px-4 py-2 rounded-lg">
              Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

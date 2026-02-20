export default function AssessmentHistory() {
  const history = [
    { name: "React Quiz", score: "80%" },
    { name: "Python Quiz", score: "90%" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Assessment History
      </h1>

      <table className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left text-gray-600">Assessment</th>
            <th className="p-3 text-left text-gray-600">Score</th>
          </tr>
        </thead>

        <tbody>
          {history.map((item, index) => (
            <tr key={index} className="border-t">
              <td className="p-3">{item.name}</td>
              <td className="p-3 text-[#24a0ed] font-medium">
                {item.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

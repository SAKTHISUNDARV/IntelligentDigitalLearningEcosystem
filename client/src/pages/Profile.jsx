export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Student",
    email: "student@example.com",
    role: "student",
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Profile
      </h1>

      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div>
          <p className="text-gray-500 text-sm">Name</p>
          <p className="text-gray-800">{user.name}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Email</p>
          <p className="text-gray-800">{user.email}</p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">Role</p>
          <p className="text-gray-800 capitalize">{user.role}</p>
        </div>
      </div>
    </div>
  );
}

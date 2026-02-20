import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Simulating user data - in real app, this would come from auth context
  localStorage.setItem(
    "user",
    JSON.stringify({ name: "Sakthi", role: "student" })
  );

  const [isLoading, setIsLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user")) || {
    name: "Student",
    role: "student"
  };

  useEffect(() => {
    // Simulate loading state
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#24a0ed]"></div>
      </div>
    );
  }

  /* ========================= */
  /* STUDENT DASHBOARD */
  /* ========================= */
  const StudentView = () => {
    const navigate = useNavigate();
    const aiProfile = JSON.parse(localStorage.getItem("aiProfile"));

    const [profile, setProfile] = useState({
      domain: "",
      experience: "",
      expectedCTC: "",
      strengths: "",
      weaknesses: ""
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
      setIsSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem("aiProfile", JSON.stringify(profile));
      window.location.reload();
    };

    const stats = [
      { 
        title: "Enrolled Courses", 
        value: 5, 
        icon: "📚",
        change: "+2 this month",
        color: "from-blue-500 to-blue-600"
      },
      { 
        title: "Completed Courses", 
        value: 2, 
        icon: "🎓",
        change: "40% completion rate",
        color: "from-green-500 to-green-600"
      },
      { 
        title: "Upcoming Assessments", 
        value: 3, 
        icon: "📝",
        change: "Next in 2 days",
        color: "from-purple-500 to-purple-600"
      },
      { 
        title: "Average Score", 
        value: "82%", 
        icon: "⭐",
        change: "Above class average",
        color: "from-orange-500 to-orange-600"
      }
    ];

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#24a0ed] to-[#1a7ab8] rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Ready to learn something new?</h2>
          <p className="text-white/90 mb-4">Continue where you left off or explore new courses</p>
          <button
            onClick={() => navigate("/explore-courses")}
            className="bg-white text-[#24a0ed] px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Explore Courses →
          </button>
        </div>

        {/* KPI Cards with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, index) => (
            <div
              key={index}
              className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{item.icon}</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full bg-gradient-to-r ${item.color} text-white`}>
                  +12%
                </span>
              </div>
              <p className="text-gray-500 text-sm">{item.title}</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{item.value}</p>
              <p className="text-xs text-gray-400 mt-2">{item.change}</p>
            </div>
          ))}
        </div>

        {/* AI Setup or Recommendations */}
        {!aiProfile ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🤖</span>
              <h2 className="text-2xl font-bold text-gray-800">
                Personalize Your Learning Journey
              </h2>
            </div>
            
            <p className="text-gray-600 mb-8">
              Help our AI understand your goals and we'll create a customized learning path just for you.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Interested Domain</label>
                <input
                  placeholder="e.g., Web Development, Data Science"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#24a0ed] focus:ring-2 focus:ring-[#24a0ed]/20 transition-all outline-none"
                  onChange={(e) => setProfile({ ...profile, domain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Experience Level</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#24a0ed] focus:ring-2 focus:ring-[#24a0ed]/20 transition-all outline-none"
                  onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                >
                  <option value="">Select experience</option>
                  <option value="Fresher">Fresher (0-1 years)</option>
                  <option value="Junior">Junior (1-3 years)</option>
                  <option value="Mid">Mid-Level (3-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Expected CTC (in LPA)</label>
                <input
                  type="number"
                  placeholder="e.g., 5, 10, 15"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#24a0ed] focus:ring-2 focus:ring-[#24a0ed]/20 transition-all outline-none"
                  onChange={(e) => setProfile({ ...profile, expectedCTC: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Strong Topics</label>
                <input
                  placeholder="e.g., HTML, CSS, JavaScript"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#24a0ed] focus:ring-2 focus:ring-[#24a0ed]/20 transition-all outline-none"
                  onChange={(e) => setProfile({ ...profile, strengths: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Topics to Improve</label>
                <input
                  placeholder="e.g., Algorithms, React Hooks, Python"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#24a0ed] focus:ring-2 focus:ring-[#24a0ed]/20 transition-all outline-none"
                  onChange={(e) => setProfile({ ...profile, weaknesses: e.target.value })}
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="mt-8 bg-gradient-to-r from-[#24a0ed] to-[#1a7ab8] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate AI Recommendations
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">🎯</span>
              <h2 className="text-2xl font-bold text-gray-800">
                Your Personalized Learning Path
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                <div className="text-blue-600 text-2xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-800 mb-2">Focus Area</h3>
                <p className="text-sm text-gray-600">
                  Based on your profile, we recommend focusing on <span className="font-medium text-blue-600">Python Loops</span> and <span className="font-medium text-blue-600">Data Structures</span>
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
                <div className="text-purple-600 text-2xl mb-3">📚</div>
                <h3 className="font-semibold text-gray-800 mb-2">Recommended Course</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-purple-600">Data Structures & Algorithms</span> - Perfect for {aiProfile.domain} roles
                </p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl">
                <div className="text-green-600 text-2xl mb-3">💼</div>
                <h3 className="font-semibold text-gray-800 mb-2">Career Track</h3>
                <p className="text-sm text-gray-600">
                  Target roles: <span className="font-medium text-green-600">Frontend Developer</span> with {aiProfile.expectedCTC} LPA potential
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <p className="text-gray-700">
                  <span className="font-semibold">Pro Tip:</span> Complete the "Python Fundamentals" module to strengthen your loops concept before moving to DSA.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Continue Learning Section */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Continue Learning</h2>
          
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="group flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#24a0ed] to-[#1a7ab8] rounded-xl flex items-center justify-center text-white text-xl">
                    {item === 1 ? "📘" : item === 2 ? "📗" : "📙"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {item === 1 ? "React Basics" : item === 2 ? "JavaScript Advanced" : "Python Programming"}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#24a0ed] to-[#1a7ab8] rounded-full"
                          style={{ width: `${item === 1 ? 70 : item === 2 ? 45 : 30}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {item === 1 ? "70%" : item === 2 ? "45%" : "30%"} complete
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/my-courses")}
                  className="opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#24a0ed] to-[#1a7ab8] text-white px-4 py-2 rounded-xl text-sm font-semibold transform hover:scale-105 transition-all"
                >
                  Resume →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ========================= */
  /* INSTRUCTOR DASHBOARD */
  /* ========================= */
  const InstructorView = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome back, Instructor!</h2>
        <p className="text-white/90">Your students are making great progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Courses Created", value: 4, icon: "📚", color: "from-blue-500 to-blue-600" },
          { title: "Total Students", value: 120, icon: "👥", color: "from-green-500 to-green-600" },
          { title: "Pending Evaluations", value: 6, icon: "⏳", color: "from-orange-500 to-orange-600" }
        ].map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{item.icon}</span>
              <span className={`bg-gradient-to-r ${item.color} text-white text-xs px-2 py-1 rounded-full`}>
                Active
              </span>
            </div>
            <p className="text-gray-500 text-sm">{item.title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            AI Insights
          </h3>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-gray-700">
              Students are struggling with <span className="font-semibold text-purple-600">recursion concepts</span>. 
              Consider uploading additional practice materials and examples.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              "5 students completed JavaScript quiz",
              "New discussion in React forum",
              "3 assignment submissions pending"
            ].map((activity, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                {activity}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ========================= */
  /* ADMIN DASHBOARD */
  /* ========================= */
  const AdminView = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
        <p className="text-white/90">Platform overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Users", value: "540", icon: "👥", change: "+12%", color: "from-blue-500 to-blue-600" },
          { title: "Active Courses", value: "32", icon: "📚", change: "+4", color: "from-green-500 to-green-600" },
          { title: "Assessments", value: "120", icon: "📝", change: "+28", color: "from-purple-500 to-purple-600" },
          { title: "Engagement", value: "78%", icon: "📈", change: "+12%", color: "from-orange-500 to-orange-600" }
        ].map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl">{item.icon}</span>
              <span className={`bg-gradient-to-r ${item.color} text-white text-xs px-2 py-1 rounded-full`}>
                {item.change}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{item.title}</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Platform Analytics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Course Completion Rate</span>
                <span className="text-sm font-semibold">78%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Student Satisfaction</span>
                <span className="text-sm font-semibold">92%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Active Users (30 days)</span>
                <span className="text-sm font-semibold">384</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '71%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🤖 AI Insights</h3>
          <p className="text-gray-600 mb-4">
            Engagement has increased by 12% this month. Course completion rates are improving across all departments.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500">Top Course</p>
              <p className="font-semibold text-gray-800">React Mastery</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500">Peak Hours</p>
              <p className="font-semibold text-gray-800">2 PM - 5 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Gradient */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Welcome back, <span className="bg-gradient-to-r from-[#24a0ed] to-[#1a7ab8] bg-clip-text text-transparent">{user.name}</span>
            </h1>
            <p className="text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">👋</span>
          </div>
        </div>

        {/* Role-based view */}
        {user.role === "student" && <StudentView />}
        {user.role === "instructor" && <InstructorView />}
        {user.role === "admin" && <AdminView />}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
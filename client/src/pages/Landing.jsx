import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap } from 'lucide-react';
import Button from '../components/ui/Button';

const flowSteps = [
  {
    step: '01',
    title: 'Register',
    text: 'Create an account and enter the learning workspace.',
  },
  {
    step: '02',
    title: 'Learn',
    text: 'Move through structured lessons and course modules.',
  },
  {
    step: '03',
    title: 'Quiz',
    text: 'Take module and final quizzes inside the same flow.',
  },
  {
    step: '04',
    title: 'Result',
    text: 'Review score history, outcomes, and performance clearly.',
  },
  {
    step: '05',
    title: 'AI Recommendation',
    text: 'Get the next best recommendation from the AI chat experience.',
  },
];



const showcaseSlides = [
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-01.png',
    alt: 'Dashboard preview',
    eyebrow: 'Dashboard',
    title: 'Start with a clear view of performance.',
    description: 'See active learning, average score, course progress, and immediate priorities without extra noise.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-02.png',
    alt: 'Learning preview',
    eyebrow: 'Learning',
    title: 'Keep learners moving with structure.',
    description: 'Show exactly where a student left off and what they should continue next.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-03.png',
    alt: 'Quiz preview',
    eyebrow: 'Quiz',
    title: 'Make assessment part of the learning flow.',
    description: 'Track attempts, results, and review history in the same product experience.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-04.png',
    alt: 'Weak areas preview',
    eyebrow: 'Weak Areas',
    title: 'Turn performance gaps into action.',
    description: 'Highlight what needs attention instead of leaving it hidden in raw score history.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-05.png',
    alt: 'AI recommendations preview',
    eyebrow: 'AI Recommendations',
    title: 'Recommend the next best step.',
    description: 'Use performance patterns to guide revision, practice, and support decisions.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-06.png',
    alt: 'Assessment detail preview',
    eyebrow: 'Results',
    title: 'Review outcomes with full context.',
    description: 'Keep score history, answer review, and performance tracking inside one clean interface.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-07.png',
    alt: 'Student workflow preview',
    eyebrow: 'Workflow',
    title: 'Keep every student touchpoint consistent.',
    description: 'Move from dashboard to tasks, assessments, and results without breaking the experience.',
  },
  {
    src: 'https://toggioulzzpplrxxtbvx.supabase.co/storage/v1/object/public/landing-assets/showcase/screenshot-08.png',
    alt: 'Platform overview preview',
    eyebrow: 'Overview',
    title: 'Present the platform as one connected system.',
    description: 'Show learning, analysis, and support as part of the same product journey.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const loopingShowcaseSlides = [...showcaseSlides, ...showcaseSlides];

  return (
    <div
      className="min-h-screen  text-[var(--text-primary)]"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 " />
        <div className="absolute left-[10%] top-24 h-72 w-72 rounded-full bg-[rgba(99,102,241,0.10)] blur-[100px]" />
        <div className="absolute bottom-10 right-[8%] h-80 w-80 rounded-full bg-[rgba(59,130,246,0.08)] blur-[120px]" />
      </div>

      <header className="relative z-20 border-b border-[var(--border)]/70 bg-white/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 text-left transition-transform duration-200 hover:translate-y-[-1px]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--brand-600),var(--brand-400))] text-white shadow-[0_18px_35px_-22px_rgba(79,70,229,0.55)]">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xl font-extrabold tracking-[-0.04em] text-[var(--text-primary)]">IDLE</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Learning Platform
              </p>
            </div>
          </button>

          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden rounded-md border px-4 text-[var(--text-secondary)] transition-all duration-200 hover:bg-white/70 hover:text-[var(--text-primary)] sm:inline-flex"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              className="rounded-md bg-[var(--brand-600)] px-5 text-white shadow-[0_18px_35px_-22px_rgba(79,70,229,0.55)] transition-all duration-200 hover:translate-y-[-1px] hover:bg-[var(--brand-700)] hover:shadow-[0_20px_40px_-22px_rgba(79,70,229,0.58)]"
              onClick={() => navigate('/register')}
            >
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-8 pb-6 pt-16 lg:px-10 lg:pb-8 lg:pt-24">
          <div className="flex items-start">
            <div className="w-full">
              <h1 className="max-w-[22ch] text-[2.75rem] font-black leading-[0.97] tracking-[-0.055em] text-[var(--text-primary)] sm:text-[3.45rem] lg:text-[4.3rem]">
                <span className="block">Most learning platforms stop at scores.</span>
                <span className="mt-1.5 block bg-[linear-gradient(135deg,var(--brand-700),var(--brand-400))] bg-clip-text text-transparent">
                  This one helps improve them.
                </span>
              </h1>

              <p className="mt-7 max-w-[56ch] text-[15px] leading-[1.85] text-[var(--text-secondary)] sm:text-[1.05rem]">
                IDLE is a performance-driven learning system that connects lessons, quizzes and AI guidance into one product flow for better academic outcomes.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="xl"
                  className="group rounded-md bg-[var(--brand-600)] px-6 text-white shadow-[0_18px_35px_-18px_rgba(79,70,229,0.5)] transition-all duration-200 hover:translate-y-[-1px] hover:bg-[var(--brand-700)] hover:shadow-[0_22px_40px_-18px_rgba(79,70,229,0.58)]"
                  onClick={() => navigate('/register')}
                >
                  Start Improving Outcomes
                  <ArrowRight size={17} className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="rounded-2xl border-[var(--border)] bg-white/70 px-5 text-[var(--text-secondary)] backdrop-blur-sm transition-all duration-200 hover:border-[var(--brand-200)] hover:bg-white hover:text-[var(--text-primary)]"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </div>

              <p className="mt-7 max-w-[56ch] text-[13px] leading-[1.8] text-[var(--text-muted)]">
                Built for structured learning programs where weak areas, revision guidance, and measurable progress actually matter.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div className=" py-8 lg:py-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">How It Works</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[var(--text-primary)] lg:text-[2.15rem]">
                  Follow the product journey from entry to improvement.
                </h2>
              </div>

            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-5">
              {flowSteps.map((item) => (
                <article
                  key={item.step}
                  className="group rounded-[24px] border border-[var(--border)]/80 bg-white/60 p-5 backdrop-blur-sm shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] transition-all duration-250 hover:-translate-y-1 hover:border-[var(--brand-200)] hover:bg-white/78 hover:shadow-[0_24px_40px_-28px_rgba(79,70,229,0.18)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.10)] text-sm font-bold text-[var(--brand-700)]">
                    {item.step}
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-[1.8] text-[var(--text-secondary)]">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div>
            <div className="px-0 py-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Product Story</p>
              <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h3 className="text-2xl font-bold tracking-[-0.04em] text-[var(--text-primary)]">See the workflow from visibility to action.</h3>
                  <p className="mt-2  text-sm leading-[1.8] text-[var(--text-secondary)]">
                    Explore the product in the same order a learner experiences it: dashboard, learning, quiz, weak areas, then AI-guided recommendations.
                  </p>
                </div>

              </div>
            </div>

            <div className="relative mt-6 overflow-hidden rounded-[28px] border border-[var(--border)]/80 bg-white/62 px-6 pb-6 pt-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.18)] backdrop-blur-sm sm:px-8 sm:pb-8">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--bg)] via-[rgba(253,253,254,0.72)] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--bg)] via-[rgba(253,253,254,0.72)] to-transparent" />
              <div className="landing-showcase-track flex w-max gap-5">
                {loopingShowcaseSlides.map((slide, index) => (
                  <article
                    key={`${slide.title}-${index}`}
                    className="group flex w-[86vw] max-w-[860px] min-w-[300px] flex-none flex-col overflow-hidden rounded-[26px] border border-[var(--border)]/80 bg-[var(--surface)] shadow-[0_18px_50px_-34px_rgba(15,23,42,0.16)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-200)] hover:shadow-[0_24px_56px_-34px_rgba(79,70,229,0.16)]"
                  >
                    <div className="relative overflow-hidden bg-[var(--surface-2)]">
                      <img
                        src={slide.src}
                        alt={slide.alt}
                        loading="lazy"
                        decoding="async"
                        className="h-[200px] w-full object-cover object-top transition-opacity duration-300 sm:h-[300px] lg:h-[400px]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col border-t border-[var(--border)] px-6 py-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-600)]">{slide.eyebrow}</p>
                      <h4 className="mt-3 text-lg font-bold tracking-tight text-[var(--text-primary)]">{slide.title}</h4>
                      <p className="mt-2 text-sm leading-[1.8] text-[var(--text-secondary)]">{slide.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

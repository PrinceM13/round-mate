import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/round-mate-logo-no-text.png"
              alt="Round Mate Logo"
              width={40}
              height={40}
              priority
            />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Round Mate
            </span>
          </div>
          <button className="bg-primary hover:bg-opacity-90 rounded-lg px-6 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 lg:py-12">
          {/* Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl leading-tight font-bold text-slate-900 dark:text-white">
                Smart Table Assignment,
                <span className="from-primary to-secondary bg-gradient-to-r bg-clip-text text-transparent">
                  {" "}
                  Perfectly Rounded
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                Round Mate simplifies seating arrangements with intelligent
                auto-assignment. Create balanced, harmonious groups in seconds,
                not hours.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary/20 mt-1 rounded-full p-2">
                  <svg
                    className="text-primary h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Intelligent Auto-Assign
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Let AI handle complex seating logic while you focus on what
                    matters
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 mt-1 rounded-full p-2">
                  <svg
                    className="text-primary h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Visual & Intuitive
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Beautiful rounded table layouts make viewing and managing
                    groups effortless
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/20 mt-1 rounded-full p-2">
                  <svg
                    className="text-primary h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Lightning Fast
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Process hundreds of assignments in milliseconds with our
                    optimized engine
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="from-primary to-secondary hover:shadow-primary/50 rounded-lg bg-gradient-to-r px-8 py-3 font-semibold text-white transition-all hover:shadow-lg">
                Start Free Trial
              </button>
              <button className="hover:border-primary hover:bg-primary/5 rounded-lg border-2 border-slate-300 px-8 py-3 font-semibold text-slate-900 transition-all dark:border-slate-700 dark:text-white">
                Learn More
              </button>
            </div>
          </div>

          {/* Logo Section */}
          <div className="flex items-center justify-center">
            <div className="relative h-96 w-96">
              <div className="from-primary/20 to-secondary/20 absolute inset-0 rounded-3xl bg-gradient-to-br blur-3xl" />
              <div className="relative flex items-center justify-center rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
                <Image
                  src="/images/round-mate-logo.png"
                  alt="Round Mate Full Logo"
                  width={300}
                  height={300}
                  priority
                  className="drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-slate-200 bg-slate-50/50 py-20 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-4xl font-bold text-slate-900 dark:text-white">
            Built for Teams
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: "👥",
                title: "Flexible Groups",
                desc: "Create groups of any size, with custom constraints and preferences",
              },
              {
                icon: "⚙️",
                title: "Smart Algorithms",
                desc: "Advanced matching ensures balanced and harmonious table assignments",
              },
              {
                icon: "📊",
                title: "Analytics",
                desc: "Track group dynamics and optimize future assignments with insights",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="from-primary via-primary to-secondary rounded-3xl bg-gradient-to-r p-12 text-center shadow-xl">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to round out your event?
          </h2>
          <p className="mb-8 text-lg text-white/90">
            Join teams already using Round Mate for smarter, faster seating
            arrangements.
          </p>
          <button className="text-primary rounded-lg bg-white px-8 py-3 font-semibold transition-all hover:bg-slate-50 hover:shadow-lg">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50/50 py-8 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-6xl px-6 text-center text-slate-600 dark:text-slate-400">
          <p>&copy; 2026 Round Mate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

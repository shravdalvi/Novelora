import React from 'react'

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'SIGN UP FREE',
      desc: 'Create an account in 10 seconds to unlock full chapters, save your bookmarks, and join chapter discussions.',
    },
    {
      step: '02',
      title: 'PICK A STORY',
      desc: 'Explore serialized fiction across fantasy, thriller, romance, and manga-style action sagas. First chapters are always free.',
    },
    {
      step: '03',
      title: 'READ & BOOKMARK',
      desc: 'Customize fonts, switch between dark and paper themes, save your reading position automatically, and leave comments.',
    },
  ]

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <div className="inline-block border-3 border-ink px-4 py-2 shadow-hard mb-3" style={{ backgroundColor: '#6A7657' }}>
          <h2 className="font-bangers text-3xl sm:text-4xl tracking-comic uppercase" style={{ color: '#D8D0C2' }}>
            HOW IT WORKS
          </h2>
        </div>
        <p className="font-grotesk text-base text-ink/70 font-bold max-w-md mx-auto">
          Start reading serial fiction without paywalls or coin locks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((s) => (
          <div
            key={s.step}
            className="flex flex-col justify-between p-6 border-3 border-ink shadow-hard transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
            style={{ backgroundColor: '#233126', color: '#FFFFFF' }}
          >
            <div>
              <div className="flex items-center justify-end mb-4">
                <span
                  className="font-bangers text-4xl"
                  style={{ color: '#FFFFFF', textShadow: '2px 2px 0 #1A1A1A' }}
                >
                  {s.step}
                </span>
              </div>
              <h3
                className="font-bangers text-2xl tracking-comic mb-2"
                style={{ color: '#FFFFFF' }}
              >
                {s.title}
              </h3>
              <p
                className="font-grotesk text-sm leading-relaxed"
                style={{ color: '#FFFFFF', opacity: 0.9 }}
              >
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

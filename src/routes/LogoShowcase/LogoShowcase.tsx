import { Logo } from '../../components/Logo';

/**
 * Brand reference page (route `/logo`) — ported from the Figma Make redesign's
 * LogoShowcase. Documents the logo system: full wordmark in default/white at
 * three sizes, the icon-only mark, usage examples, and design rationale.
 */
export function LogoShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f6f3] to-[#ebe9e3] p-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1c1a17] mb-12">CampAwayDesign Logo System</h1>

        <div className="space-y-12">
          {/* Full logo */}
          <section className="bg-white rounded-3xl border border-[#e3e0da] p-12 shadow-lg" aria-label="Full logo">
            <h2 className="text-2xl font-bold text-[#1c1a17] mb-8">Full Logo</h2>
            <div className="space-y-8">
              {(['lg', 'md', 'sm'] as const).map((size) => (
                <div key={size}>
                  <p className="text-sm text-[#6b6560] mb-4 font-semibold">
                    {{ lg: 'Large (64px)', md: 'Medium (48px)', sm: 'Small (32px)' }[size]}
                  </p>
                  <div className="flex items-center gap-8 flex-wrap">
                    <div className="p-6 bg-[#f7f6f3] rounded-xl">
                      <Logo variant="default" size={size} />
                    </div>
                    <div className="p-6 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] rounded-xl">
                      <Logo variant="white" size={size} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Mark only */}
          <section className="bg-white rounded-3xl border border-[#e3e0da] p-12 shadow-lg" aria-label="Logo mark">
            <h2 className="text-2xl font-bold text-[#1c1a17] mb-8">Logo Mark (Icon Only)</h2>
            <p className="text-sm text-[#6b6560] mb-4 font-semibold">Various sizes</p>
            <div className="flex items-center gap-8 flex-wrap">
              <div className="p-6 bg-[#f7f6f3] rounded-xl"><Logo variant="mark" size="lg" /></div>
              <div className="p-6 bg-[#f7f6f3] rounded-xl"><Logo variant="mark" size="md" /></div>
              <div className="p-6 bg-[#f7f6f3] rounded-xl"><Logo variant="mark" size="sm" /></div>
              <div className="p-6 bg-gradient-to-r from-[#2f6f4f] to-[#3d8a64] rounded-xl">
                <Logo variant="mark" size="lg" />
              </div>
            </div>
          </section>

          {/* Usage examples */}
          <section className="bg-white rounded-3xl border border-[#e3e0da] p-12 shadow-lg" aria-label="Usage examples">
            <h2 className="text-2xl font-bold text-[#1c1a17] mb-8">Usage Examples</h2>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-[#6b6560] mb-3 font-semibold">Navigation bar</p>
                <div className="bg-white border border-[#e3e0da] rounded-2xl p-4 flex items-center justify-between">
                  <Logo variant="default" size="md" />
                  <div className="flex gap-2">
                    <span className="px-4 py-2 bg-[#f7f6f3] rounded-lg text-sm font-medium">Projects</span>
                    <span className="px-4 py-2 bg-[#f7f6f3] rounded-lg text-sm font-medium">Dashboard</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-[#6b6560] mb-3 font-semibold">App icon / favicon</p>
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-white border border-[#e3e0da] rounded-2xl flex items-center justify-center shadow-lg">
                    <Logo variant="mark" size="md" />
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-[#2f6f4f] to-[#3d8a64] rounded-2xl flex items-center justify-center shadow-lg">
                    <Logo variant="mark" size="md" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rationale */}
          <section className="bg-white rounded-3xl border border-[#e3e0da] p-12 shadow-lg" aria-label="Design rationale">
            <h2 className="text-2xl font-bold text-[#1c1a17] mb-6">Design Rationale</h2>
            <ul className="space-y-4 text-[#6b6560] list-none p-0 m-0">
              {[
                { swatch: 'bg-[#2f6f4f]', title: 'Mountain / tent shape', body: 'Represents outdoor camping and adventure, evoking the freedom of tiny-home living.' },
                { swatch: 'bg-[#2f6f4f]', title: 'Trailer base', body: 'The core of the business — SUV-towable tiny-home trailers with compact, efficient design.' },
                { swatch: 'bg-[#6b6560]', title: 'Wheels', body: 'Mobility and freedom — these homes can go anywhere, enabling the camping lifestyle.' },
                { swatch: 'bg-white border border-[#e3e0da]', title: 'Window detail', body: 'A subtle window element adds a touch of home, warmth, and livability.' },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span aria-hidden="true" className={`flex-shrink-0 w-8 h-8 rounded-lg ${item.swatch}`} />
                  <div>
                    <p className="font-semibold text-[#1c1a17] mb-1">{item.title}</p>
                    <p className="text-sm">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

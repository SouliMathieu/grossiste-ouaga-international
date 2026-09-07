import { MessageCircle, Phone } from 'lucide-react';

export function TopBar() {
  return (
    <div className="bg-goi-navy text-white">
      <div className="mx-auto flex min-h-10 max-w-[1360px] items-center justify-between px-4 text-sm sm:px-6">
        <p className="hidden text-white/75 sm:block">
          Grossiste & distribution à Ouagadougou
        </p>

        <div className="ml-auto flex items-center gap-4">
          <a
            href="tel:+22600000000"
            className="flex items-center gap-2 hover:text-goi-gold"
          >
            <Phone size={15} />
            <span>+226 XX XX XX XX</span>
          </a>

          <a
            href="#"
            className="hidden items-center gap-2 hover:text-goi-gold sm:flex"
          >
            <MessageCircle size={15} />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

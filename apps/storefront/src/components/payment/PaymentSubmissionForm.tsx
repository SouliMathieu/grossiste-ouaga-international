import { useState, type FormEvent } from 'react';
import { getOrderAccessToken } from '../../lib/order-access';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

type SubmitPaymentResponse = {
  data?: {
    status: string;
  };
  message?: string;
};

type PaymentSubmissionFormProps = {
  reference: string;
  onSubmitted: (status: string) => void;
};

export function PaymentSubmissionForm({
  reference,
  onSubmitted,
}: PaymentSubmissionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [payerPhone, setPayerPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedPhone = payerPhone.trim();
    const normalizedTransactionId = transactionId.trim();

    if (!normalizedPhone) {
      setSubmitError(
        'Veuillez renseigner le numéro utilisé pour le paiement.',
      );
      return;
    }

    if (!normalizedTransactionId) {
      setSubmitError(
        'Veuillez renseigner l’identifiant de transaction.',
      );
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const accessToken =
        getOrderAccessToken(reference);

      if (!accessToken) {
        throw new Error(
          'Cette commande n’est plus accessible dans cette session.',
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/api/orders/${encodeURIComponent(
          reference,
        )}/payment/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Order-Access-Token':
              accessToken,
          },
          body: JSON.stringify({
            payerPhone: normalizedPhone,
            transactionId: normalizedTransactionId,
          }),
        },
      );

      const payload = (await response
        .json()
        .catch(() => null)) as SubmitPaymentResponse | null;

      if (!response.ok) {
        throw new Error(
          payload?.message ??
            'Impossible d’enregistrer votre confirmation de paiement.',
        );
      }

      if (!payload?.data?.status) {
        throw new Error(
          'Le statut du paiement est indisponible.',
        );
      }

      onSubmitted(payload.data.status);
      setIsOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <div className="mt-6 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => {
            setSubmitError(null);
            setIsOpen(true);
          }}
          className="min-h-12 rounded-goi-md bg-goi-blue px-5 font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-goi-blue focus:ring-offset-2"
        >
          J’ai effectué le paiement
        </button>

        <p className="mt-3 text-sm leading-6 text-goi-muted">
          Utilisez ce bouton uniquement après avoir effectué le transfert
          Mobile Money.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-4 border-t border-slate-200 pt-6"
      onSubmit={handleSubmit}
    >
      <div>
        <h3 className="font-bold text-goi-navy">
          Confirmer votre paiement
        </h3>

        <p className="mt-2 text-sm leading-6 text-goi-muted">
          Indiquez les informations du transfert que vous venez d’effectuer.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-goi-navy">
          Téléphone utilisé pour le paiement *
        </span>

        <input
          required
          type="tel"
          autoComplete="tel"
          placeholder="+226"
          value={payerPhone}
          disabled={isSubmitting}
          onChange={(event) => setPayerPhone(event.target.value)}
          className="mt-2 h-12 w-full rounded-goi-md border border-slate-200 bg-white px-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-goi-navy">
          Identifiant de transaction *
        </span>

        <input
          required
          type="text"
          placeholder="Ex. TX123456789"
          value={transactionId}
          disabled={isSubmitting}
          onChange={(event) => setTransactionId(event.target.value)}
          className="mt-2 h-12 w-full rounded-goi-md border border-slate-200 bg-white px-4 outline-none focus:border-goi-blue disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>

      {submitError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-goi-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-goi-danger"
        >
          {submitError}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 rounded-goi-md bg-goi-blue px-5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? 'Enregistrement...'
            : 'Envoyer pour vérification'}
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setSubmitError(null);
            setIsOpen(false);
          }}
          className="min-h-12 rounded-goi-md border border-slate-200 px-5 font-semibold text-goi-navy hover:bg-goi-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          Annuler
        </button>
      </div>

      <p className="text-xs leading-5 text-goi-muted">
        Cette confirmation ne marque pas automatiquement le paiement comme
        payé. GOI doit d’abord le vérifier.
      </p>
    </form>
  );
}

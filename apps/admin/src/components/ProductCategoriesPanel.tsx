import {
  useState,
  type FormEvent,
} from 'react';
import { adminFetch } from '../lib/admin-fetch';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  'http://localhost:4000';

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type Props = {
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
};

type CategoryForm = {
  name: string;
  description: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: CategoryForm = {
  name: '',
  description: '',
  sortOrder: '0',
  active: true,
};

export function ProductCategoriesPanel({
  categories,
  isLoading,
  onRefresh,
}: Props) {
  const [form, setForm] =
    useState<CategoryForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [actionId, setActionId] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      description:
        category.description ?? '',
      sortOrder: String(
        category.sortOrder,
      ),
      active: category.active,
    });
    setError(null);
    setSuccess(null);
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) {
      return;
    }

    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    const sortOrder = Number(
      form.sortOrder,
    );

    if (
      form.name.trim().length < 2
    ) {
      setError(
        'Le nom doit contenir au moins 2 caractères.',
      );
      return;
    }

    if (
      !Number.isInteger(sortOrder) ||
      sortOrder < 0
    ) {
      setError(
        'L’ordre doit être un entier positif ou nul.',
      );
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await adminFetch(
        editingId
          ? `${API_BASE_URL}/api/admin/catalog/categories/${editingId}`
          : `${API_BASE_URL}/api/admin/catalog/categories`,
        {
          method: editingId
            ? 'PATCH'
            : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description:
              form.description.trim() ||
              null,
            sortOrder,
            active: form.active,
          }),
        },
      );

      const result =
        (await response.json()) as
          ApiResponse<Category>;

      if (!response.ok) {
        throw new Error(
          result.message ??
            'Impossible d’enregistrer la catégorie.',
        );
      }

      setSuccess(
        editingId
          ? 'Catégorie modifiée.'
          : 'Catégorie créée.',
      );

      setIsFormOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await onRefresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleCategory(
    category: Category,
  ) {
    if (actionId !== null) {
      return;
    }

    setActionId(category.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/catalog/categories/${category.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            active: !category.active,
          }),
        },
      );

      const result =
        (await response.json()) as
          ApiResponse<Category>;

      if (!response.ok) {
        throw new Error(
          result.message ??
            'Impossible de modifier la catégorie.',
        );
      }

      setSuccess(
        category.active
          ? 'Catégorie désactivée.'
          : 'Catégorie activée.',
      );

      await onRefresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setActionId(null);
    }
  }

  async function deleteCategory(
    category: Category,
  ) {
    if (
      category.productCount > 0 ||
      actionId !== null
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Supprimer définitivement "${category.name}" ?`,
    );

    if (!confirmed) {
      return;
    }

    setActionId(category.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await adminFetch(
        `${API_BASE_URL}/api/admin/catalog/categories/${category.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );

      const result =
        (await response.json()) as
          ApiResponse<{ id: number }>;

      if (!response.ok) {
        throw new Error(
          result.message ??
            'Impossible de supprimer la catégorie.',
        );
      }

      setSuccess(
        'Catégorie supprimée.',
      );

      await onRefresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Une erreur inattendue est survenue.',
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-950">
              Catégories
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {categories.length} catégorie
              {categories.length > 1
                ? 's'
                : ''}{' '}
              configurée
              {categories.length > 1
                ? 's'
                : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void onRefresh()
              }
              className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Actualiser
            </button>

            <button
              type="button"
              onClick={startCreate}
              className="min-h-10 rounded-lg bg-[#0E3B2E] px-4 text-sm font-semibold text-white hover:bg-[#1F7A4D]"
            >
              + Nouvelle catégorie
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Chargement...
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h4 className="font-bold text-slate-900">
            Aucune catégorie
          </h4>

          <p className="mt-2 text-sm text-slate-500">
            Créez la première catégorie du catalogue.
          </p>

          <button
            type="button"
            onClick={startCreate}
            className="mt-5 min-h-10 rounded-lg bg-[#0E3B2E] px-4 text-sm font-semibold text-white hover:bg-[#1F7A4D]"
          >
            + Nouvelle catégorie
          </button>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="p-4">
                  Catégorie
                </th>
                <th className="p-4">
                  Produits
                </th>
                <th className="p-4">
                  Ordre
                </th>
                <th className="p-4">
                  Statut
                </th>
                <th className="p-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.map(
                (category) => (
                  <tr
                    key={category.id}
                    className="border-b border-slate-100 hover:bg-slate-50/70"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-slate-900">
                        {category.name}
                      </p>

                      {category.description && (
                        <p className="mt-1 max-w-md text-xs text-slate-500">
                          {
                            category.description
                          }
                        </p>
                      )}
                    </td>

                    <td className="p-4 font-semibold">
                      {category.productCount}
                    </td>

                    <td className="p-4">
                      {category.sortOrder}
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          category.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {category.active
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(
                              category,
                            )
                          }
                          disabled={
                            actionId ===
                            category.id
                          }
                          className="min-h-10 rounded-lg bg-emerald-50 px-3 font-semibold text-[#0E3B2E] hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleCategory(
                              category,
                            )
                          }
                          disabled={
                            actionId ===
                            category.id
                          }
                          className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {category.active
                            ? 'Désactiver'
                            : 'Activer'}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteCategory(
                              category,
                            )
                          }
                          disabled={
                            category.productCount >
                              0 ||
                            actionId ===
                              category.id
                          }
                          title={
                            category.productCount >
                            0
                              ? 'Déplacez d’abord les produits de cette catégorie.'
                              : 'Supprimer définitivement'
                          }
                          className="min-h-10 rounded-lg bg-red-50 px-3 font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/40"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
            className="h-full w-full max-w-xl overflow-y-auto bg-[#F4F6F2] shadow-2xl"
          >
            <form
              onSubmit={handleSubmit}
              className="min-h-full p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="category-form-title"
                    className="text-xl font-bold text-slate-950"
                  >
                    {editingId
                      ? 'Modifier la catégorie'
                      : 'Nouvelle catégorie'}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    La référence web est générée automatiquement.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="min-h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>

              <div className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="block">
                  <span className="text-sm font-semibold">
                    Nom *
                  </span>

                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name:
                          event.target
                            .value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Description
                  </span>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      }))
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 p-4"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">
                    Ordre d’affichage
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder:
                          event.target
                            .value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        active:
                          event.target
                            .checked,
                      }))
                    }
                    className="mt-0.5 size-5"
                  />

                  <span>
                    <span className="block text-sm font-semibold">
                      Catégorie active
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Une catégorie inactive n’est plus proposée publiquement.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="min-h-11 rounded-lg bg-[#0E3B2E] px-6 text-sm font-semibold text-white hover:bg-[#1F7A4D] disabled:opacity-60"
                >
                  {isSaving
                    ? 'Enregistrement...'
                    : editingId
                      ? 'Enregistrer'
                      : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

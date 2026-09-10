import {
  Plus,
  Trash2,
} from 'lucide-react';

export type ProductAttributeInput = {
  name: string;
  value: string;
};

type ProductAttributesFieldsProps = {
  value: ProductAttributeInput[];
  onChange: (
    value: ProductAttributeInput[],
  ) => void;
};

export function ProductAttributesFields({
  value,
  onChange,
}: ProductAttributesFieldsProps) {
  function update(
    index: number,
    field: keyof ProductAttributeInput,
    fieldValue: string,
  ) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: fieldValue,
            }
          : item,
      ),
    );
  }

  function remove(index: number) {
    onChange(
      value.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  return (
    <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-slate-900">
            Caractéristiques
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Ajoutez les informations techniques utiles sous forme Nom / Valeur.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange([
              ...value,
              {
                name: '',
                value: '',
              },
            ])
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {value.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
          Aucune caractéristique ajoutée.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {value.map(
            (attribute, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-xl bg-white p-3 md:grid-cols-[1fr_1.4fr_auto]"
              >
                <input
                  value={attribute.name}
                  maxLength={120}
                  onChange={(event) =>
                    update(
                      index,
                      'name',
                      event.target.value,
                    )
                  }
                  placeholder="Nom — ex. Puissance"
                  className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"
                />

                <input
                  value={attribute.value}
                  maxLength={500}
                  onChange={(event) =>
                    update(
                      index,
                      'value',
                      event.target.value,
                    )
                  }
                  placeholder="Valeur — ex. 200 W"
                  className="min-h-11 rounded-lg border border-slate-200 px-3 text-sm"
                />

                <button
                  type="button"
                  onClick={() =>
                    remove(index)
                  }
                  className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600"
                  aria-label={`Supprimer la caractéristique ${index + 1}`}
                >
                  <Trash2 size={16} />
                  <span className="md:hidden">
                    Supprimer
                  </span>
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

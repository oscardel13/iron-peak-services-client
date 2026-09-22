"use client";

import StepShell from "../step-shell/step-shell.component";
import { MATERIAL_OPTIONS } from "../../utils/booking-data";
import { productSupportsMaterial } from "../../utils/booking-helpers";

function SectionTitle({ children }) {
  return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

function getProductLabel(product) {
  return (
    product?.label ||
    product?.inventoryLabel ||
    product?.dumpsterLabel ||
    product?.name ||
    "Dumpster"
  );
}

function getProductSize(product) {
  return product?.size ?? product?.sizeValue ?? product?.dumpsterSize ?? null;
}

function getIncludedDays(product) {
  return product?.includedDays || product?.rentalDaysIncluded || 7;
}

function getIncludedWeightText(product) {
  return product?.includedWeightText || product?.includedWeight || "";
}

function getAddonPrice(addon) {
  return Number(addon?.price || 0);
}

export default function StepDumpsterDetails({
  bookingForm,
  updateBookingForm,
  setSelectedProduct,
  toggleAddon,

  // New: these should come from useBookingFlow.
  availableProducts = [],
  dumpsters = [],
  addons = [],
  loadingAvailableItems = false,

  goToNextStep,
  goToPreviousStep,
  formErrors = {},
}) {
  const products = dumpsters.length > 0 ? dumpsters : availableProducts;
  const selectedMaterial = bookingForm.dumpster.material;

  function getSelectedProduct() {
    if (!bookingForm.dumpster.productId) return null;

    return products.find((product) => {
      return product.id === bookingForm.dumpster.productId;
    });
  }

  function handleMaterialSelect(materialValue) {
    const selectedProduct = getSelectedProduct();

    const selectedProductStillSupportsMaterial =
      !selectedProduct ||
      productSupportsMaterial(selectedProduct, materialValue);

    updateBookingForm("dumpster.material", materialValue);

    /**
     * Concrete disposal surcharge should be treated as an addon.
     * Selecting concrete auto-checks it.
     * Selecting another material removes it.
     */
    if (materialValue === "concrete") {
      toggleAddon("concreteSurcharge", true);
    } else {
      toggleAddon("concreteSurcharge", false);
    }

    /**
     * Important:
     * Do not clear productId/productLabel/size/basePrice/concretePrice here
     * unless that exact selected product does not support the new material.
     */
    if (!selectedProductStillSupportsMaterial) {
      updateBookingForm("dumpster.productId", "");
      updateBookingForm("dumpster.productLabel", "");
      updateBookingForm("dumpster.size", "");
      updateBookingForm("dumpster.basePrice", 0);
      updateBookingForm("dumpster.concretePrice", 0);
      updateBookingForm("dumpster.includedWeightText", "");
      updateBookingForm("pricing.basePrice", 0);
      updateBookingForm("pricing.materialSurcharge", 0);
    }
  }

  return (
    <StepShell
      title="Choose your dumpster"
      description="Select the material for pricing, then choose your dumpster."
      onNext={goToNextStep}
      onBack={goToPreviousStep}
      errors={formErrors}
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <SectionTitle>Material</SectionTitle>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {MATERIAL_OPTIONS.map((option) => {
              const isSelected = selectedMaterial === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleMaterialSelect(option.value)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold">{option.label}</p>
                </button>
              );
            })}
          </div>

          {selectedMaterial === "concrete" && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="font-semibold text-amber-800">
                Concrete disposal surcharge applies
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Available dumpsters</SectionTitle>

          {!bookingForm.schedule.deliveryDate ? (
            <p className="text-sm text-gray-500">
              Choose a delivery date first so we can check dumpster
              availability.
            </p>
          ) : !bookingForm.schedule.unknownPickup &&
            !bookingForm.schedule.pickupDate ? (
            <p className="text-sm text-gray-500">
              Choose a pickup date so we can check dumpster availability.
            </p>
          ) : loadingAvailableItems ? (
            <p className="text-sm text-gray-500">
              Checking available dumpsters...
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500">
              No dumpsters are available for the selected dates.
            </p>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => {
                const productLabel = getProductLabel(product);
                const productSize = getProductSize(product);
                const includedDays = getIncludedDays(product);
                const includedWeightText = getIncludedWeightText(product);

                const isSelected =
                  bookingForm.dumpster.productId === product.id;

                const supportsSelectedMaterial = productSupportsMaterial(
                  product,
                  selectedMaterial,
                );

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={!supportsSelectedMaterial}
                    onClick={() => setSelectedProduct(product)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50"
                        : !supportsSelectedMaterial
                          ? "cursor-not-allowed border-gray-200 bg-gray-100 opacity-60"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {productLabel}
                        </p>

                        {productSize ? (
                          <p className="mt-1 text-sm text-gray-500">
                            Size: {productSize} yd
                          </p>
                        ) : null}

                        {includedWeightText ? (
                          <p className="mt-1 text-sm text-gray-500">
                            Included: {includedWeightText}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm text-gray-500">
                          {includedDays} days included, then $25/day
                        </p>

                        {!supportsSelectedMaterial ? (
                          <p className="mt-2 text-sm font-medium text-red-600">
                            This dumpster does not support the selected
                            material.
                          </p>
                        ) : null}
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xl font-semibold text-gray-900">
                          ${Number(product.basePrice || 0).toFixed(2)}
                        </p>

                        {selectedMaterial === "concrete" ? (
                          <p className="mt-1 text-sm text-amber-700">
                            + ${Number(product.concretePrice || 0).toFixed(2)}{" "}
                            concrete fee
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <SectionTitle>Add-ons</SectionTitle>

          {addons.length === 0 ? (
            <p className="text-sm text-gray-500">
              No add-ons are available right now.
            </p>
          ) : (
            <div className="grid gap-4">
              {addons.map((addon) => {
                const addonCode = addon.code;
                const isConcreteSurcharge = addonCode === "concreteSurcharge";
                const concreteMaterialSelected =
                  selectedMaterial === "concrete";

                const checked =
                  isConcreteSurcharge && concreteMaterialSelected
                    ? true
                    : Boolean(bookingForm.addons?.[addonCode]);

                const disabled =
                  isConcreteSurcharge && concreteMaterialSelected;

                return (
                  <label
                    key={addon.id || addonCode}
                    className={`flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 ${
                      disabled
                        ? "cursor-not-allowed opacity-80"
                        : "cursor-pointer"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {addon.name}
                      </p>

                      {addon.description ? (
                        <p className="mt-1 text-sm text-gray-500">
                          {addon.description}
                        </p>
                      ) : null}

                      {isConcreteSurcharge && concreteMaterialSelected ? (
                        <p className="mt-2 text-xs font-medium text-amber-700">
                          Required for concrete disposal.
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        ${getAddonPrice(addon).toFixed(2)}
                      </span>

                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) => {
                          if (disabled) return;
                          toggleAddon(addonCode, event.target.checked);
                        }}
                        className="h-5 w-5 disabled:cursor-not-allowed"
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StepShell>
  );
}

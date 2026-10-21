"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

type ServiceCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  requires_verification?: boolean;
  requires_background_check?: boolean;
  requires_driving_documents?: boolean;
  requires_specialist_documents?: boolean;
};

type SelectedService = {
  service_category_id: number;
  hourly_rate: string;
  years_experience: string;
  experience_summary: string;
};

type AvailabilityDay = {
  day_of_week: number;
  name: string;
  shortName: string;
  is_available: boolean;
  start_time: string;
  end_time: string;
};

const provinces = [
  ["AB", "Alberta"],
  ["BC", "British Columbia"],
  ["MB", "Manitoba"],
  ["NB", "New Brunswick"],
  ["NL", "Newfoundland and Labrador"],
  ["NS", "Nova Scotia"],
  ["NT", "Northwest Territories"],
  ["NU", "Nunavut"],
  ["ON", "Ontario"],
  ["PE", "Prince Edward Island"],
  ["QC", "Quebec"],
  ["SK", "Saskatchewan"],
  ["YT", "Yukon"],
];

const initialAvailability: AvailabilityDay[] = [
  {
    day_of_week: 0,
    name: "Sunday",
    shortName: "Sun",
    is_available: false,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_of_week: 1,
    name: "Monday",
    shortName: "Mon",
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_of_week: 2,
    name: "Tuesday",
    shortName: "Tue",
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_of_week: 3,
    name: "Wednesday",
    shortName: "Wed",
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_of_week: 4,
    name: "Thursday",
    shortName: "Thu",
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_of_week: 5,
    name: "Friday",
    shortName: "Fri",
    is_available: true,
    start_time: "09:00",
    end_time: "17:00",
  },
  {
    day_of_week: 6,
    name: "Saturday",
    shortName: "Sat",
    is_available: false,
    start_time: "09:00",
    end_time: "17:00",
  },
];

const steps = [
  { number: 1, title: "Services" },
  { number: 2, title: "Service area" },
  { number: 3, title: "Experience" },
  { number: 4, title: "Availability" },
  { number: 5, title: "Verification" },
  { number: 6, title: "Review" },
];

function getStoredToken() {
  if (typeof window === "undefined") return null;

  return (
    sessionStorage.getItem("urbanhelphub_token") ||
    localStorage.getItem("urbanhelphub_token")
  );
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  const raw =
    sessionStorage.getItem("urbanhelphub_user") ||
    localStorage.getItem("urbanhelphub_user");

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatMoney(value: string) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return "Rate not set";
  }

  return `$${number.toFixed(2)}/hr`;
}

export default function BecomeAHelperPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );

  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("ON");
  const [postalCode, setPostalCode] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  const [availability, setAvailability] =
    useState<AvailabilityDay[]>(initialAvailability);

  const [timezone, setTimezone] = useState("America/Toronto");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCategories = useMemo(() => {
    return categories.filter((category) =>
      selectedServices.some(
        (service) => service.service_category_id === category.id
      )
    );
  }, [categories, selectedServices]);

  const needsBackgroundCheck = selectedCategories.some(
    (category) => category.requires_background_check
  );

  const needsDrivingDocuments = selectedCategories.some(
    (category) => category.requires_driving_documents
  );

  const needsSpecialistDocuments = selectedCategories.some(
    (category) => category.requires_specialist_documents
  );

  useEffect(() => {
    async function loadPage() {
      const token = getStoredToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        router.replace("/login");
        return;
      }

      if (storedUser.role !== "helper") {
        router.replace("/dashboard");
        return;
      }

      setUser(storedUser);
      setPhone(storedUser.phone || "");

      try {
        const [categoriesResponse, onboardingResponse] = await Promise.all([
          fetch(`${API_URL}/service-categories`, {
            headers: {
              Accept: "application/json",
            },
          }),
          fetch(`${API_URL}/helper/onboarding`, {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const categoriesJson = await categoriesResponse.json();
        const onboardingJson = await onboardingResponse.json();

        if (!categoriesResponse.ok) {
          throw new Error(
            categoriesJson.message || "Unable to load service categories."
          );
        }

        if (!onboardingResponse.ok) {
          if (onboardingResponse.status === 401) {
            sessionStorage.removeItem("urbanhelphub_token");
            sessionStorage.removeItem("urbanhelphub_user");
            localStorage.removeItem("urbanhelphub_token");
            localStorage.removeItem("urbanhelphub_user");

            router.replace("/login");
            return;
          }

          throw new Error(
            onboardingJson.message || "Unable to load Helper onboarding."
          );
        }

        setCategories(categoriesJson.data || []);

        const profile = onboardingJson.data?.profile;

        if (profile) {
          setPhone(profile.phone || storedUser.phone || "");
          setCity(profile.city || "");
          setProvince(profile.province || "ON");
          setPostalCode(profile.postal_code || "");
          setHeadline(profile.headline || "");
          setBio(profile.bio || "");
        }

        const existingServices = onboardingJson.data?.services || [];

        if (existingServices.length > 0) {
          setSelectedServices(
            existingServices.map(
              (service: {
                service_category_id: number;
                hourly_rate?: string | number | null;
                years_experience?: string | number | null;
                experience_summary?: string | null;
              }) => ({
                service_category_id: service.service_category_id,
                hourly_rate:
                  service.hourly_rate !== null &&
                  service.hourly_rate !== undefined
                    ? String(service.hourly_rate)
                    : "",
                years_experience:
                  service.years_experience !== null &&
                  service.years_experience !== undefined
                    ? String(service.years_experience)
                    : "",
                experience_summary: service.experience_summary || "",
              })
            )
          );
        }

        const existingAvailability =
          onboardingJson.data?.availability || [];

        if (existingAvailability.length > 0) {
          setAvailability(
            initialAvailability.map((day) => {
              const saved = existingAvailability.find(
                (item: { day_of_week: number }) =>
                  Number(item.day_of_week) === day.day_of_week
              );

              if (!saved) return day;

              return {
                ...day,
                is_available: Boolean(saved.is_available),
                start_time: saved.start_time
                  ? String(saved.start_time).slice(0, 5)
                  : "09:00",
                end_time: saved.end_time
                  ? String(saved.end_time).slice(0, 5)
                  : "17:00",
              };
            })
          );

          if (existingAvailability[0]?.timezone) {
            setTimezone(existingAvailability[0].timezone);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading your application."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [router]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function toggleService(categoryId: number) {
    clearMessages();

    setSelectedServices((current) => {
      const exists = current.some(
        (service) => service.service_category_id === categoryId
      );

      if (exists) {
        return current.filter(
          (service) => service.service_category_id !== categoryId
        );
      }

      return [
        ...current,
        {
          service_category_id: categoryId,
          hourly_rate: "",
          years_experience: "",
          experience_summary: "",
        },
      ];
    });
  }

  function updateService(
    categoryId: number,
    field: keyof Omit<SelectedService, "service_category_id">,
    value: string
  ) {
    setSelectedServices((current) =>
      current.map((service) =>
        service.service_category_id === categoryId
          ? { ...service, [field]: value }
          : service
      )
    );
  }

  function updateAvailability(
    dayOfWeek: number,
    field: keyof AvailabilityDay,
    value: boolean | string
  ) {
    setAvailability((current) =>
      current.map((day) =>
        day.day_of_week === dayOfWeek
          ? {
              ...day,
              [field]: value,
            }
          : day
      )
    );
  }

  async function saveServices() {
    clearMessages();

    if (selectedServices.length === 0) {
      setError("Choose at least one service you would like to offer.");
      return false;
    }

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return false;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/helper/onboarding/services`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            services: selectedServices.map((service) => ({
              service_category_id: service.service_category_id,
              hourly_rate:
                service.hourly_rate === ""
                  ? null
                  : Number(service.hourly_rate),
              years_experience:
                service.years_experience === ""
                  ? null
                  : Number(service.years_experience),
              experience_summary:
                service.experience_summary.trim() || null,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save your selected services."
        );
      }

      setMessage("Services saved.");
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your services."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile() {
    clearMessages();

    if (!city.trim()) {
      setError("Enter the Canadian city where you will provide services.");
      return false;
    }

    if (!postalCode.trim()) {
      setError("Enter your Canadian postal code.");
      return false;
    }

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return false;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/helper/onboarding/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            phone: phone.trim() || null,
            city: city.trim(),
            province,
            postal_code: postalCode.trim(),
            headline: headline.trim() || null,
            bio: bio.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const firstValidationError =
          data.errors &&
          Object.values(data.errors).flat().find(Boolean);

        throw new Error(
          typeof firstValidationError === "string"
            ? firstValidationError
            : data.message || "Unable to save your profile."
        );
      }

      setMessage("Service area saved.");
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your profile."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAvailability() {
    clearMessages();

    const availableDays = availability.filter(
      (day) => day.is_available
    );

    if (availableDays.length === 0) {
      setError("Choose at least one day when you are available.");
      return false;
    }

    const invalidTime = availableDays.some(
      (day) => day.start_time >= day.end_time
    );

    if (invalidTime) {
      setError(
        "For each available day, the end time must be later than the start time."
      );
      return false;
    }

    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return false;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/helper/onboarding/availability`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            timezone,
            availability: availability.map((day) => ({
              day_of_week: day.day_of_week,
              start_time: day.is_available ? day.start_time : null,
              end_time: day.is_available ? day.end_time : null,
              is_available: day.is_available,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save your availability."
        );
      }

      setMessage("Availability saved.");
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your availability."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function nextStep() {
    if (saving) return;

    if (step === 1) {
      if (selectedServices.length === 0) {
        setError("Choose at least one service to continue.");
        return;
      }

      clearMessages();
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (step === 2) {
      const saved = await saveProfile();

      if (!saved) return;

      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (step === 3) {
      const incomplete = selectedServices.some(
        (service) =>
          service.hourly_rate === "" ||
          service.years_experience === ""
      );

      if (incomplete) {
        setError(
          "Add your hourly rate and years of experience for each selected service."
        );
        return;
      }

      const saved = await saveServices();

      if (!saved) return;

      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (step === 4) {
      const saved = await saveAvailability();

      if (!saved) return;

      setStep(5);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (step === 5) {
      clearMessages();
      setStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function previousStep() {
    clearMessages();

    setStep((current) => Math.max(1, current - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function finishApplication() {
    clearMessages();

    const servicesSaved = await saveServices();

    if (!servicesSaved) {
      setStep(3);
      return;
    }

    const profileSaved = await saveProfile();

    if (!profileSaved) {
      setStep(2);
      return;
    }

    const availabilitySaved = await saveAvailability();

    if (!availabilitySaved) {
      setStep(4);
      return;
    }

    setMessage(
      "Your Helper application has been saved and is ready for verification."
    );

    setTimeout(() => {
      router.push("/helper/dashboard");
    }, 900);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f9fc]">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center px-5 py-5 sm:px-8">
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-10 w-auto"
            />
          </div>
        </header>

        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#2fad45]" />
            <p className="mt-4 font-medium text-slate-600">
              Loading your Helper application...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="cursor-pointer"
            aria-label="UrbanHelpHub home"
          >
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-9 w-auto sm:h-10"
            />
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[#082f5b]">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">
                Helper application
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9f7ec] font-bold text-[#238f39]">
              {user?.name?.charAt(0).toUpperCase() || "H"}
            </div>
          </div>
        </div>
      </header>

      <section className="bg-[#082f5b]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-green-300">
              Become a Helper
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Turn what you do well into meaningful local work.
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-200">
              Tell us what you can help with, where you work, and when
              you&apos;re available. We&apos;ll guide you through the
              verification required for your services.
            </p>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8">
          <div className="flex min-w-[720px] items-center py-5">
            {steps.map((item, index) => {
              const active = item.number === step;
              const complete = item.number < step;

              return (
                <div
                  key={item.number}
                  className="flex flex-1 items-center"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (item.number < step) {
                        clearMessages();
                        setStep(item.number);
                      }
                    }}
                    className="flex items-center gap-2 text-left"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        complete
                          ? "bg-[#2fad45] text-white"
                          : active
                          ? "bg-[#082f5b] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {complete ? "✓" : item.number}
                    </span>

                    <span
                      className={`text-sm font-semibold ${
                        active
                          ? "text-[#082f5b]"
                          : complete
                          ? "text-[#238f39]"
                          : "text-slate-500"
                      }`}
                    >
                      {item.title}
                    </span>
                  </button>

                  {index < steps.length - 1 && (
                    <div
                      className={`mx-4 h-px flex-1 ${
                        complete
                          ? "bg-[#2fad45]"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_310px] lg:py-14">
        <div>
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-800">
              {message}
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2fad45]">
                Step 1 of 6
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
                What can you help with?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Choose every service you&apos;re comfortable providing.
                You can update these later.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => {
                  const selected = selectedServices.some(
                    (service) =>
                      service.service_category_id === category.id
                  );

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleService(category.id)}
                      className={`group rounded-2xl border p-5 text-left transition ${
                        selected
                          ? "border-[#2fad45] bg-[#f0fbf2] shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f8] text-xl">
                          {category.slug.includes("clean")
                            ? "✨"
                            : category.slug.includes("moving")
                            ? "📦"
                            : category.slug.includes("furniture")
                            ? "🪑"
                            : category.slug.includes("delivery")
                            ? "🛍️"
                            : category.slug.includes("repair")
                            ? "🛠️"
                            : category.slug.includes("mount")
                            ? "🖼️"
                            : category.slug.includes("yard")
                            ? "🌿"
                            : category.slug.includes("snow")
                            ? "❄️"
                            : category.slug.includes("driv")
                            ? "🚗"
                            : category.slug.includes("baby")
                            ? "🧸"
                            : "🤝"}
                        </div>

                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${
                            selected
                              ? "border-[#2fad45] bg-[#2fad45] text-white"
                              : "border-slate-300 text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </div>

                      <h3 className="mt-4 font-bold text-[#082f5b]">
                        {category.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {category.description ||
                          "Provide trusted local help to customers who need this service."}
                      </p>

                      {(category.requires_background_check ||
                        category.requires_driving_documents) && (
                        <p className="mt-3 text-xs font-semibold text-slate-500">
                          Additional verification required
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2fad45]">
                Step 2 of 6
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
                Where will you work?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Add your primary Canadian service area. Your exact home
                address is not displayed publicly.
              </p>

              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      City
                    </span>
                    <input
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="e.g. Toronto"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Province or territory
                    </span>
                    <select
                      value={province}
                      onChange={(event) =>
                        setProvince(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                    >
                      {provinces.map(([code, name]) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Postal code
                    </span>
                    <input
                      value={postalCode}
                      onChange={(event) =>
                        setPostalCode(
                          event.target.value.toUpperCase()
                        )
                      }
                      placeholder="M5V 2T6"
                      maxLength={7}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 uppercase outline-none transition focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-bold text-slate-700">
                      Phone
                    </span>
                    <input
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      placeholder="+1 416 555 0123"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                    />
                  </label>
                </div>

                <div className="mt-6 rounded-2xl bg-[#f4f8fc] p-5">
                  <div className="flex gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="font-bold text-[#082f5b]">
                        Your privacy matters
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Customers should see your general service area,
                        not your private residential address.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2fad45]">
                Step 3 of 6
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
                Tell customers what you bring.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Add your experience and starting hourly rate for each
                service. Rates can be refined later.
              </p>

              <div className="mt-8 space-y-5">
                {selectedCategories.map((category) => {
                  const service = selectedServices.find(
                    (item) =>
                      item.service_category_id === category.id
                  );

                  if (!service) return null;

                  return (
                    <div
                      key={category.id}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7"
                    >
                      <h3 className="text-xl font-bold text-[#082f5b]">
                        {category.name}
                      </h3>

                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <label>
                          <span className="text-sm font-bold text-slate-700">
                            Starting hourly rate (CAD)
                          </span>
                          <div className="relative mt-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                              $
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              value={service.hourly_rate}
                              onChange={(event) =>
                                updateService(
                                  category.id,
                                  "hourly_rate",
                                  event.target.value
                                )
                              }
                              placeholder="30.00"
                              className="w-full rounded-xl border border-slate-300 py-3.5 pl-8 pr-4 outline-none focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                            />
                          </div>
                        </label>

                        <label>
                          <span className="text-sm font-bold text-slate-700">
                            Years of experience
                          </span>
                          <input
                            type="number"
                            min="0"
                            max="80"
                            value={service.years_experience}
                            onChange={(event) =>
                              updateService(
                                category.id,
                                "years_experience",
                                event.target.value
                              )
                            }
                            placeholder="3"
                            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                          />
                        </label>
                      </div>

                      <label className="mt-5 block">
                        <span className="text-sm font-bold text-slate-700">
                          Relevant experience
                        </span>
                        <textarea
                          value={service.experience_summary}
                          onChange={(event) =>
                            updateService(
                              category.id,
                              "experience_summary",
                              event.target.value
                            )
                          }
                          rows={4}
                          placeholder={`Briefly describe your experience with ${category.name.toLowerCase()}...`}
                          className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                        />
                      </label>
                    </div>
                  );
                })}

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                  <h3 className="font-bold text-[#082f5b]">
                    Your public Helper profile
                  </h3>

                  <label className="mt-5 block">
                    <span className="text-sm font-bold text-slate-700">
                      Profile headline
                    </span>
                    <input
                      value={headline}
                      onChange={(event) =>
                        setHeadline(event.target.value)
                      }
                      maxLength={120}
                      placeholder="Reliable local Helper who takes pride in a job well done"
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                    />
                  </label>

                  <label className="mt-5 block">
                    <span className="text-sm font-bold text-slate-700">
                      About you
                    </span>
                    <textarea
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      rows={5}
                      maxLength={2000}
                      placeholder="Introduce yourself, your approach to work, and what customers can expect when they hire you."
                      className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-[#2fad45] focus:ring-4 focus:ring-green-100"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2fad45]">
                Step 4 of 6
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
                When are you usually available?
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Set your normal weekly availability. You&apos;ll be able
                to manage individual dates later.
              </p>

              <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                {availability.map((day) => (
                  <div
                    key={day.day_of_week}
                    className="border-b border-slate-100 p-5 last:border-b-0 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <label className="flex min-w-[160px] cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={day.is_available}
                          onChange={(event) =>
                            updateAvailability(
                              day.day_of_week,
                              "is_available",
                              event.target.checked
                            )
                          }
                          className="h-5 w-5 accent-[#2fad45]"
                        />
                        <span className="font-bold text-[#082f5b]">
                          {day.name}
                        </span>
                      </label>

                      {day.is_available ? (
                        <div className="flex flex-1 items-center gap-3">
                          <input
                            type="time"
                            value={day.start_time}
                            onChange={(event) =>
                              updateAvailability(
                                day.day_of_week,
                                "start_time",
                                event.target.value
                              )
                            }
                            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-[#2fad45]"
                          />

                          <span className="text-sm font-medium text-slate-400">
                            to
                          </span>

                          <input
                            type="time"
                            value={day.end_time}
                            onChange={(event) =>
                              updateAvailability(
                                day.day_of_week,
                                "end_time",
                                event.target.value
                              )
                            }
                            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-[#2fad45]"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          Not available
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <label className="mt-6 block max-w-md">
                <span className="text-sm font-bold text-slate-700">
                  Time zone
                </span>

                <select
                  value={timezone}
                  onChange={(event) =>
                    setTimezone(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none focus:border-[#2fad45]"
                >
                  <option value="America/St_Johns">
                    Newfoundland
                  </option>
                  <option value="America/Halifax">Atlantic</option>
                  <option value="America/Toronto">Eastern</option>
                  <option value="America/Winnipeg">Central</option>
                  <option value="America/Edmonton">Mountain</option>
                  <option value="America/Vancouver">Pacific</option>
                </select>
              </label>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2fad45]">
                Step 5 of 6
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
                Build trust before your first task.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Verification requirements depend on the services you
                selected. Documents will be handled securely and will
                not be shown publicly.
              </p>

              <div className="mt-8 space-y-4">
                <VerificationCard
                  title="Identity verification"
                  description="Government-issued identification and basic identity checks."
                  required
                  status="Required"
                />

                <VerificationCard
                  title="Background check"
                  description="May be required for higher-trust services such as childcare."
                  required={needsBackgroundCheck}
                  status={
                    needsBackgroundCheck
                      ? "Required for your services"
                      : "Not currently required"
                  }
                />

                <VerificationCard
                  title="Driving documents"
                  description="Driver's licence and other applicable driving documentation."
                  required={needsDrivingDocuments}
                  status={
                    needsDrivingDocuments
                      ? "Required for your services"
                      : "Not currently required"
                  }
                />

                <VerificationCard
                  title="Trade or specialist documents"
                  description="Licences, qualifications or certificates where a service requires them."
                  required={needsSpecialistDocuments}
                  status={
                    needsSpecialistDocuments
                      ? "Required for your services"
                      : "Not currently required"
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">
                  Document upload comes next
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  We&apos;re not collecting sensitive documents through
                  this temporary screen. The secure document-upload
                  module will use the dedicated Helper document system
                  before Helpers are approved for applicable services.
                </p>
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#2fad45]">
                Step 6 of 6
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#082f5b]">
                Review your Helper application.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-600">
                Make sure the essentials look right. Your selected
                services will remain pending until the applicable
                verification and approval process is complete.
              </p>

              <div className="mt-8 space-y-5">
                <ReviewSection
                  title="Helper"
                  onEdit={() => setStep(2)}
                >
                  <p className="font-bold text-[#082f5b]">
                    {user?.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {user?.email}
                  </p>
                  <p className="text-sm text-slate-600">
                    {phone || "No phone added"}
                  </p>
                </ReviewSection>

                <ReviewSection
                  title="Service area"
                  onEdit={() => setStep(2)}
                >
                  <p className="font-semibold text-slate-700">
                    {city || "City not entered"},{" "}
                    {province || "Province"}{" "}
                    {postalCode ? `• ${postalCode}` : ""}
                  </p>
                </ReviewSection>

                <ReviewSection
                  title="Services & rates"
                  onEdit={() => setStep(3)}
                >
                  <div className="space-y-3">
                    {selectedCategories.map((category) => {
                      const service = selectedServices.find(
                        (item) =>
                          item.service_category_id === category.id
                      );

                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between gap-4"
                        >
                          <span className="font-semibold text-slate-700">
                            {category.name}
                          </span>
                          <span className="text-sm font-bold text-[#238f39]">
                            {formatMoney(
                              service?.hourly_rate || ""
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ReviewSection>

                <ReviewSection
                  title="Weekly availability"
                  onEdit={() => setStep(4)}
                >
                  <div className="flex flex-wrap gap-2">
                    {availability
                      .filter((day) => day.is_available)
                      .map((day) => (
                        <span
                          key={day.day_of_week}
                          className="rounded-full bg-[#eef3f8] px-3 py-1.5 text-sm font-semibold text-[#082f5b]"
                        >
                          {day.shortName} {day.start_time}–
                          {day.end_time}
                        </span>
                      ))}
                  </div>
                </ReviewSection>

                <div className="rounded-3xl bg-[#082f5b] p-6 text-white sm:p-7">
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2fad45] text-xl">
                      ✓
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">
                        Ready for the next stage
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-200">
                        Saving this application does not automatically
                        make your services public. Required verification
                        and approval still need to be completed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {step > 1 && (
                <button
                  type="button"
                  onClick={previousStep}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-bold text-[#082f5b] transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Back
                </button>
              )}
            </div>

            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={saving}
                className="rounded-xl bg-[#2fad45] px-7 py-3.5 font-bold text-white shadow-sm transition hover:bg-[#269d3c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Continue"}
              </button>
            ) : (
              <button
                type="button"
                onClick={finishApplication}
                disabled={saving}
                className="rounded-xl bg-[#2fad45] px-7 py-3.5 font-bold text-white shadow-sm transition hover:bg-[#269d3c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving application..."
                  : "Save Helper application"}
              </button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#2fad45]">
              Your application
            </p>

            <h3 className="mt-2 text-xl font-bold text-[#082f5b]">
              {user?.name || "Helper"}
            </h3>

            <p className="mt-1 break-all text-sm text-slate-500">
              {user?.email}
            </p>

            <div className="my-5 h-px bg-slate-100" />

            <div className="space-y-4">
              <SummaryRow
                label="Services"
                value={
                  selectedServices.length
                    ? `${selectedServices.length} selected`
                    : "Not selected"
                }
                complete={selectedServices.length > 0}
              />

              <SummaryRow
                label="Service area"
                value={
                  city && province
                    ? `${city}, ${province}`
                    : "Not added"
                }
                complete={Boolean(city && province && postalCode)}
              />

              <SummaryRow
                label="Availability"
                value={`${availability.filter((day) => day.is_available).length} days`}
                complete={
                  availability.some((day) => day.is_available)
                }
              />

              <SummaryRow
                label="Verification"
                value="Pending"
                complete={false}
              />
            </div>

            <div className="mt-6 rounded-2xl bg-[#f4f8fc] p-4">
              <p className="text-sm font-bold text-[#082f5b]">
                You&apos;re in control
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Choose the services, rates and availability that work
                for you. Approval requirements vary by service.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <img
            src="/UrbanHelpHub-logo.png"
            alt="UrbanHelpHub"
            className="h-8 w-auto self-start"
          />

          <p className="text-sm text-slate-500">
            Local help. Clear expectations. Stronger communities.
          </p>
        </div>
      </footer>
    </main>
  );
}

function VerificationCard({
  title,
  description,
  required,
  status,
}: {
  title: string;
  description: string;
  required: boolean;
  status: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 sm:p-6 ${
        required
          ? "border-green-200"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${
            required
              ? "bg-green-50 text-[#238f39]"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {required ? "✓" : "—"}
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-[#082f5b]">
              {title}
            </h3>

            <span
              className={`self-start rounded-full px-3 py-1 text-xs font-bold ${
                required
                  ? "bg-green-50 text-[#238f39]"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {status}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-bold text-[#082f5b]">
          {title}
        </h3>

        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-bold text-[#238f39] hover:underline"
        >
          Edit
        </button>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  complete,
}: {
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">
          {label}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {value}
        </p>
      </div>

      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          complete
            ? "bg-green-50 text-[#238f39]"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {complete ? "✓" : "•"}
      </span>
    </div>
  );
}

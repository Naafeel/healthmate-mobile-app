import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  healthRecordRepository,
  healthRecordStore,
  useHealthRecords,
} from "@/store/healthRecords";
import {
  localDate,
  validateRecordForm,
  type FieldErrors,
  type RecordFields,
} from "@/domain/records/validation";
import { RecordError, recordErrorMessage } from "@/domain/records/recordErrors";
export function useRecordForm(id?: number) {
  const [fields, setFields] = useState<RecordFields>({
    date: localDate(),
    steps: "",
    calories: "",
    water: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(id !== undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | undefined>();
  const [retry, setRetry] = useState(0);
  const submitting = useRef(false);
  const mutating = useHealthRecords((s) => s.mutating);
  useEffect(() => {
    let active = true;
    healthRecordStore.getState().clearFeedback();
    if (id === undefined) return;
    void healthRecordRepository
      .getRecordById(id)
      .then((record) => {
        if (!active) return;
        if (!record) {
          setLoadError("This record no longer exists. Return to Records.");
          return;
        }
        setFields({
          date: record.date,
          steps: String(record.steps),
          calories: String(record.calories),
          water: String(record.water),
        });
      })
      .catch((e) => {
        if (active) setLoadError(recordErrorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  function change(field: keyof RecordFields, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setError(null);
    setDuplicateId(undefined);
  }
  async function save() {
    if (submitting.current || mutating) return;
    const result = validateRecordForm(fields);
    setErrors(result.errors);
    setError(null);
    setDuplicateId(undefined);
    if (!result.input) {
      setError("Please correct the highlighted fields before saving.");
      return;
    }
    submitting.current = true;
    try {
      await healthRecordStore.getState().save(result.input, id);
      router.replace("/(tabs)/records");
    } catch (e) {
      setError(recordErrorMessage(e));
      if (e instanceof RecordError && e.code === "duplicate")
        setDuplicateId(e.existingId);
    } finally {
      submitting.current = false;
    }
  }
  return {
    fields,
    errors,
    change,
    loading,
    loadError,
    retry: () => {
      setLoading(true);
      setLoadError(null);
      setRetry((v) => v + 1);
    },
    error,
    duplicateId,
    save,
    mutating,
  };
}

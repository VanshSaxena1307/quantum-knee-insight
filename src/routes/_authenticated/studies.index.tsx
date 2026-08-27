import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layers, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { EmptyState, ErrorState, ModeBadge, PageHeader } from "@/components/hqml/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useDemoMode } from "@/hooks/useDemoMode";
import {
  createStudy,
  finalizeStudyUpload,
  listDatasets,
  listStudies,
  uploadStudyFile,
} from "@/services/hqmlService";

export const Route = createFileRoute("/_authenticated/studies/")({
  head: () => ({
    meta: [
      { title: "MRI studies — HQML" },
      {
        name: "description",
        content: "Register knee MRI studies, upload DICOM/NIfTI series and track preprocessing status.",
      },
      { property: "og:title", content: "MRI studies — HQML" },
      { property: "og:description", content: "Study registry and upload workspace." },
    ],
  }),
  component: StudiesPage,
});

function StudiesPage() {
  const qc = useQueryClient();
  const { activeMode } = useDemoMode();
  const studies = useQuery({ queryKey: ["studies"], queryFn: () => listStudies(200) });
  const datasets = useQuery({ queryKey: ["datasets"], queryFn: listDatasets });

  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("");
  const [datasetId, setDatasetId] = useState<string>("none");
  const [acq, setAcq] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const create = useMutation({
    mutationFn: async () => {
      const study = await createStudy({
        patient_reference: ref,
        dataset_id: datasetId === "none" ? null : datasetId,
        acquisition_date: acq || null,
        notes: notes || null,
        mode: activeMode,
      });
      let uploaded = 0;
      for (const file of Array.from(files ?? [])) {
        await uploadStudyFile(study.id, file);
        uploaded += 1;
      }
      await finalizeStudyUpload(study.id, uploaded);
      return study;
    },
    onSuccess: () => {
      toast.success("Study registered");
      setOpen(false);
      setRef("");
      setNotes("");
      setFiles(null);
      void qc.invalidateQueries({ queryKey: ["studies"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Data"
        title="MRI studies"
        description="De-identified patient references only. Uploaded series are stored in private buckets and served through short-lived signed URLs."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload aria-hidden className="mr-2 size-4" /> New study
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Register MRI study</DialogTitle>
                <DialogDescription>
                  New records are tagged <strong>{activeMode}</strong> based on the current platform mode.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ref">Patient reference (de-identified)</Label>
                  <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="MRNET-0042" />
                </div>
                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select value={datasetId} onValueChange={setDatasetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {datasets.data?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acq">Acquisition date</Label>
                  <Input id="acq" type="date" value={acq} onChange={(e) => setAcq(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="files">Series files (DICOM / NIfTI / PNG)</Label>
                  <Input id="files" type="file" multiple onChange={(e) => setFiles(e.target.files)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button disabled={!ref || create.isPending} onClick={() => create.mutate()}>
                  {create.isPending ? "Saving…" : "Register study"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {studies.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : studies.isError ? (
        <ErrorState message={(studies.error as Error).message} onRetry={() => void studies.refetch()} />
      ) : (studies.data?.length ?? 0) === 0 ? (
        <EmptyState icon={Layers} title="No studies registered" description="Register a study to start the pipeline." />
      ) : (
        <div className="panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Modality</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Preprocessing</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studies.data?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link
                      to="/studies/$studyId"
                      params={{ studyId: s.id }}
                      className="font-medium text-accent hover:underline"
                    >
                      {s.patient_reference}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.modality ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{s.file_count}</TableCell>
                  <TableCell className="text-muted-foreground">{s.preprocessing_status}</TableCell>
                  <TableCell>
                    <ModeBadge mode={s.mode} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}

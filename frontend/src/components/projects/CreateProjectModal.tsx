import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient, listClients } from "../../api/misc";
import { createProject } from "../../api/projects";
import { Modal } from "../common/Modal";
import { getApiErrorMessage } from "../../api/client";

export function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: clients } = useQuery({ queryKey: ["clients"], queryFn: listClients });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createClientMutation = useMutation({
    mutationFn: () => createClient(newClientName),
    onSuccess: (client) => {
      queryClient.setQueryData<typeof clients>(["clients"], (old) => [...(old ?? []), client]);
      setClientId(client.id);
      setNewClientName("");
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "pm"] });
      onClose();
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <Modal title="New project" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createProjectMutation.mutate({ name, description: description || undefined, clientId });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Project name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
          <select
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a client
            </option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="Or add a new client..."
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
            />
            <button
              type="button"
              disabled={!newClientName || createClientMutation.isPending}
              onClick={() => createClientMutation.mutate()}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={createProjectMutation.isPending || !clientId}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Create project
          </button>
        </div>
      </form>
    </Modal>
  );
}

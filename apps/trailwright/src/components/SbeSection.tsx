import type { FC } from 'react';
import type { Hardware } from '../model/schema';
import { SelectInput, TextInput } from './Field';

// The wording is shared by the prerequisites (README, docs) and this screen, so it never drifts.
export const SBE_PREREQUISITE =
  "Download your hardware vendor's Solution Builder Extension package for your model and the Azure Local version you deploy. It is a requirement: you need it to update the cluster, and the automation reads it from a share and checks it before the cluster is created. Installing it during the build is optional (off by default).";
export const SBE_LEARN_URL = 'https://learn.microsoft.com/azure/azure-local/update/solution-builder-extension';

type Props = { sbe: Hardware['sbe']; onChange: (patch: Partial<Hardware['sbe']>) => void };

// Where the Solution Builder Extension (SBE) package is, whether the requirement applies, and whether to side-load it at build time.
// The password of the account that reads the share is a Key Vault secret name, never typed here as a value.
export const SbeSection: FC<Props> = ({ sbe, onChange }) => (
  <div className="space-y-4" data-testid="sbe-section">
    <h2 className="text-lg font-medium text-gray-800">Solution Builder Extension (SBE) package</h2>
    <p className="text-sm text-gray-700" data-testid="sbe-prerequisite">
      {SBE_PREREQUISITE}
    </p>
    <p className="text-xs text-gray-500">
      The download differs by vendor and is not checked here. Dell AX and MC need a login-gated download from Dell support. See{' '}
      <a className="underline" href={SBE_LEARN_URL} target="_blank" rel="noreferrer">
        Solution Builder Extension updates for your Azure Local
      </a>
      .
    </p>
    <SelectInput
      id="sbe-requirement"
      label="Does the Solution Builder Extension requirement apply?"
      value={sbe.requirement}
      onChange={(requirement) => onChange({ requirement: requirement as Hardware['sbe']['requirement'] })}
      options={[
        { value: 'required', label: 'Required: the package is on a share' },
        { value: 'not_applicable', label: 'Not applicable (give the reason)' },
      ]}
      hint="Not applicable is for hardware without a Solution Builder Extension, or a cluster that downloads it with the vendor credential."
    />
    {sbe.requirement === 'not_applicable' ? (
      <TextInput id="sbe-reason" label="Why it does not apply" value={sbe.notApplicableReason} onChange={(notApplicableReason) => onChange({ notApplicableReason })} hint="One sentence, for example: no Solution Builder Extension exists for this hardware model." />
    ) : (
      <div className="space-y-4">
        <TextInput id="sbe-source-path" label="Where is the package? (share or folder)" value={sbe.sourcePath} onChange={(sourcePath) => onChange({ sourcePath })} placeholder="\files.example.invalid\sbe\vendor" hint="The share or folder that holds the three files as the vendor delivers them. No credential or query string in the path." />
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput id="sbe-source-username" label="Account that reads the share (optional)" value={sbe.sourceUsername} onChange={(sourceUsername) => onChange({ sourceUsername })} hint="Only when the account running the automation cannot read it. Read access only." />
          <TextInput id="sbe-source-secret" label="Key Vault secret that holds its password" value={sbe.sourcePasswordSecret} onChange={(sourcePasswordSecret) => onChange({ sourcePasswordSecret })} hint="The secret name only, in the Key Vault of this design. Never the password." />
        </div>
        <SelectInput
          id="sbe-delivery"
          label="Install it during the build (side-load)?"
          value={sbe.delivery}
          onChange={(delivery) => onChange({ delivery: delivery as Hardware['sbe']['delivery'] })}
          options={[
            { value: 'skip', label: 'No (default)' },
            { value: 'winrm_copy', label: 'Yes: copy to the nodes over WinRM' },
            { value: 'node_pull', label: 'Yes: each node pulls it from a read-only location' },
          ]}
          hint="Optional. The package is still checked before the cluster is created, and you still need it for the first update."
        />
      </div>
    )}
  </div>
);

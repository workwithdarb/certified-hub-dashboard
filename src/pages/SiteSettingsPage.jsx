import PageEditor, { BilingualInput, SectionWrapper } from '../components/PageEditor'
import { pagesAPI } from '../lib/api'
import { useState } from 'react'

function SocialLinkEditor({ links, onChange }) {
  const addLink = () => {
    onChange([...links, { platform: '', url: '', icon: '' }])
  }

  const removeLink = (index) => {
    onChange(links.filter((_, i) => i !== index))
  }

  const updateLink = (index, field, value) => {
    const updated = [...links]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {links?.map((link, i) => (
        <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1 grid grid-cols-3 gap-2">
            <select
              value={link.platform || ''}
              onChange={(e) => updateLink(i, 'platform', e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Platform</option>
              <option value="twitter">Twitter</option>
              <option value="instagram">Instagram</option>
              <option value="linkedin">LinkedIn</option>
              <option value="facebook">Facebook</option>
            </select>
            <input
              type="text"
              placeholder="URL (https://...)"
              value={link.url || ''}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              className="col-span-2 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => removeLink(i)}
            className="px-2 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLink}
        className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
      >
        + Add Social Link
      </button>
    </div>
  )
}

export default function SiteSettingsPage() {
  const [openSections, setOpenSections] = useState({ footer: true, notifications: true })

  return (
    <PageEditor
      apiGet={pagesAPI.getSiteSettings}
      apiUpdate={pagesAPI.updateSiteSettings}
      pageName="Site Settings (Footer & Social Links)"
    >
      {({ data, setData, updateField }) => (
        <>
          <SectionWrapper
            title="Footer"
            open={openSections.footer}
            onToggle={() => setOpenSections(p => ({ ...p, footer: !p.footer }))}
          >
            <BilingualInput label="Tagline Slogan" value={data?.footer?.taglineSlogan} onChange={(v) => updateField('footer', 'taglineSlogan', v)} />
            <BilingualInput label="Social Media Accounts Label" value={data?.footer?.socialMediaAccounts} onChange={(v) => updateField('footer', 'socialMediaAccounts', v)} />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                value={data?.footer?.email || ''}
                onChange={(e) => setData(prev => ({ ...prev, footer: { ...prev?.footer, email: e.target.value } }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                value={data?.footer?.phone || ''}
                onChange={(e) => setData(prev => ({ ...prev, footer: { ...prev?.footer, phone: e.target.value } }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1 pt-4">
              <label className="block text-sm font-medium text-gray-700">Social Links</label>
              <SocialLinkEditor
                links={data?.footer?.socialLinks || []}
                onChange={(links) => setData(prev => ({ ...prev, footer: { ...prev?.footer, socialLinks: links } }))}
              />
            </div>
          </SectionWrapper>

          <SectionWrapper
            title="Notifications"
            open={openSections.notifications}
            onToggle={() => setOpenSections(p => ({ ...p, notifications: !p.notifications }))}
          >
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Notification Email</label>
              <input
                type="email"
                value={data?.notificationEmail || ''}
                onChange={(e) => setData(prev => ({ ...prev, notificationEmail: e.target.value }))}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <p className="text-xs text-gray-400">Where new contact messages and admin alerts are sent. Leave empty to use the default.</p>
            </div>
          </SectionWrapper>
        </>
      )}
    </PageEditor>
  )
}

import PageEditor, { BilingualInput, SectionWrapper, ArrayEditor, IconSelect } from '../components/PageEditor'
import { pagesAPI } from '../lib/api'
import { useState } from 'react'

export default function KnowledgeHubPage() {
  const [openSections, setOpenSections] = useState({ hero: true })

  return (
    <PageEditor
      apiGet={pagesAPI.getKnowledgeHub}
      apiUpdate={pagesAPI.updateKnowledgeHub}
      pageName="Knowledge Hub Page"
    >
      {({ data, setData, updateField }) => (
        <>
          <SectionWrapper
            title="Hero Section"
            open={openSections.hero}
            onToggle={() => setOpenSections(p => ({ ...p, hero: !p.hero }))}
          >
            <BilingualInput label="Title" value={data?.hero?.title} onChange={(v) => updateField('hero', 'title', v)} />
            <BilingualInput label="Subtitle" value={data?.hero?.subtitle} onChange={(v) => updateField('hero', 'subtitle', v)} />
            <BilingualInput label="Description" value={data?.hero?.heroDesc} onChange={(v) => updateField('hero', 'heroDesc', v)} textarea />
          </SectionWrapper>

          <SectionWrapper
            title="Categories"
            open={openSections.categories}
            onToggle={() => setOpenSections(p => ({ ...p, categories: !p.categories }))}
          >
            <ArrayEditor
              label="Categories"
              items={data?.categories || []}
              onChange={(items) => setData(prev => ({ ...prev, categories: items }))}
              template={{ icon: '', title: { en: '', ar: '' }, desc: { en: '', ar: '' } }}
              renderItem={(item, i, onUpdate) => (
                <>
                  <IconSelect value={item.icon} onChange={(v) => onUpdate({ ...item, icon: v })} />
                  <BilingualInput label="Title" value={item.title} onChange={(v) => onUpdate({ ...item, title: v })} />
                  <BilingualInput label="Description" value={item.desc} onChange={(v) => onUpdate({ ...item, desc: v })} textarea />
                </>
              )}
            />
          </SectionWrapper>

          <SectionWrapper
            title="Blog Section"
            open={openSections.blog}
            onToggle={() => setOpenSections(p => ({ ...p, blog: !p.blog }))}
          >
            <BilingualInput label="Blog Title" value={data?.blogTitle} onChange={(v) => setData(prev => ({ ...prev, blogTitle: v }))} />
            <BilingualInput label="Blog Subtitle" value={data?.blogSubtitle} onChange={(v) => setData(prev => ({ ...prev, blogSubtitle: v }))} textarea />
            <ArrayEditor
              label="Articles"
              items={data?.articles || []}
              onChange={(items) => setData(prev => ({ ...prev, articles: items }))}
              template={{
                title: { en: '', ar: '' },
                excerpt: { en: '', ar: '' },
                content: { en: '', ar: '' },
                coverImage: '',
                author: '',
                publishedAt: new Date().toISOString().slice(0, 10),
                isPublished: true,
              }}
              renderItem={(item, i, onUpdate) => (
                <>
                  <BilingualInput label="Title" value={item.title} onChange={(v) => onUpdate({ ...item, title: v })} />
                  <BilingualInput label="Excerpt (short summary)" value={item.excerpt} onChange={(v) => onUpdate({ ...item, excerpt: v })} textarea rows={2} />
                  <BilingualInput label="Content" value={item.content} onChange={(v) => onUpdate({ ...item, content: v })} textarea rows={7} />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Cover image URL</label>
                      <input
                        value={item.coverImage || ''}
                        onChange={(e) => onUpdate({ ...item, coverImage: e.target.value })}
                        placeholder="https://…"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Author</label>
                      <input
                        value={item.author || ''}
                        onChange={(e) => onUpdate({ ...item, author: e.target.value })}
                        placeholder="e.g. Certified Hub Team"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Publish date</label>
                      <input
                        type="date"
                        value={item.publishedAt ? String(item.publishedAt).slice(0, 10) : ''}
                        onChange={(e) => onUpdate({ ...item, publishedAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                  {item.coverImage && (
                    <img src={item.coverImage} alt="" className="h-24 w-full max-w-xs rounded-lg object-cover border border-gray-200" />
                  )}
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={item.isPublished !== false}
                      onChange={(e) => onUpdate({ ...item, isPublished: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Published (visible on the site)
                  </label>
                </>
              )}
            />
          </SectionWrapper>
        </>
      )}
    </PageEditor>
  )
}

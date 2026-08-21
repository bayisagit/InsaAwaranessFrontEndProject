with open('src/components/admin/ResourcesManager.tsx', 'r') as f:
    content = f.read()

modal_code = """
            <Modal isOpen={!!viewingResource} onClose={() => setViewingResource(null)} title="View Resource">
                {viewingResource && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{viewingResource.title}</h3>
                            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider mb-4">
                                <span className="bg-muted px-2 py-1 rounded-full text-muted-foreground">{viewingResource.category}</span>
                                <span className="bg-muted px-2 py-1 rounded-full text-muted-foreground">{viewingResource.audience}</span>
                                <span className={`px-2 py-1 rounded-full ${viewingResource.status === 'published' ? 'bg-green-50 text-green-600' : viewingResource.status === 'submitted' ? 'bg-blue-50 text-blue-600' : viewingResource.status === 'archived' ? 'bg-muted/50 text-muted-foreground' : 'bg-yellow-50 text-yellow-600'}`}>
                                    {viewingResource.status}
                                </span>
                            </div>
                        </div>

                        {viewingResource.content && (
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Content</h4>
                                <div className="bg-muted/30 p-4 rounded-xl text-sm text-foreground whitespace-pre-wrap font-serif leading-relaxed">
                                    {viewingResource.content}
                                </div>
                            </div>
                        )}

                        {viewingResource.file_url && (
                            <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 border-b border-border pb-1">Attached File</h4>
                                <a href={viewingResource.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    View/Download File
                                </a>
                            </div>
                        )}

                        {viewingResource.status === 'submitted' && user?.role === 'super_admin' && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                                <Button variant="outline" onClick={() => { setViewingResource(null); openRejectModal(viewingResource.id); }}>Reject</Button>
                                <Button variant="primary" onClick={() => { setViewingResource(null); handleApprove(viewingResource.id); }}>Approve</Button>
                            </div>
                        )}
                        <div className={viewingResource.status === 'submitted' && user?.role === 'super_admin' ? "hidden" : "flex justify-end pt-4"}>
                            <Button variant="outline" onClick={() => setViewingResource(null)}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
"""

if '</Modal>\n        </div>\n    );\n}' in content:
    content = content.replace('</Modal>\n        </div>\n    );\n}', '</Modal>\n' + modal_code)
elif '</Modal>\n\t\t</div>\n\t);\n}' in content:
    content = content.replace('</Modal>\n\t\t</div>\n\t);\n}', '</Modal>\n' + modal_code)
elif '</Modal>\n    </div>\n  );\n}' in content:
    content = content.replace('</Modal>\n    </div>\n  );\n}', '</Modal>\n' + modal_code)
else:
    # fallback, just insert before the last "}"
    idx = content.rfind('}')
    content = content[:idx] + modal_code + '\n'

with open('src/components/admin/ResourcesManager.tsx', 'w') as f:
    f.write(content)

print("Done modal")

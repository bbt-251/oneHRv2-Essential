import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { EditorState, Modifier, convertFromRaw, convertToRaw } from "draft-js";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import CustomCascader from "@/components/custom-cascader";
import { documentDynamicOptions } from "@/lib/util/document";
import { DocumentDefinitionModel } from "@/lib/models/document";
import { useTheme } from "@/components/theme-provider";

const Editor = dynamic(() => import("react-draft-wysiwyg").then(mod => mod.Editor), { ssr: false });

const RichText = ({
    form,
    index,
    data,
}: {
    form: any;
    index: number;
    data?: DocumentDefinitionModel;
}) => {
    const { theme } = useTheme();
    const [editorState, setEditorState] = useState<EditorState>(EditorState.createEmpty());
    const isFirstRender = useRef(true);

    // Load from edit modal
    useEffect(() => {
        const oldValues = data?.content;
        if (oldValues && oldValues[index]) {
            const rawContentState = JSON.parse(oldValues[index]);
            const contentState = convertFromRaw(rawContentState);
            const editorState = EditorState.createWithContent(contentState);
            onEditorStateChange(editorState);
        }
    }, [data?.content, index]);

    // Load from saved form after error
    useEffect(() => {
        const oldValues = form.content;
        if (oldValues[index]) {
            const rawContentState = JSON.parse(oldValues[index]);
            const contentState = convertFromRaw(rawContentState);
            const editorState = EditorState.createWithContent(contentState);
            onEditorStateChange(editorState);
        }
    }, [form, index]);

    // Keep editor content synced
    useEffect(() => {
        const oldValues = form.content;
        const contentState = editorState.getCurrentContent();
        const rawContentState = convertToRaw(contentState);

        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        oldValues[index] = JSON.stringify(rawContentState);
    }, [editorState, form, index]);

    function setDynamicOptions(dyOptions: string) {
        const currentContent = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();
        const newContentState = Modifier.insertText(currentContent, selectionState, `${dyOptions}`);
        const newEditorState = EditorState.push(editorState, newContentState, "insert-characters");
        setEditorState(newEditorState);
    }

    const onEditorStateChange = (newEditorState: EditorState): void => {
        setEditorState(newEditorState);
    };

    const handlePastedText = (text: string, html: string | undefined): boolean => {
        if (html) {
            const currentContent = editorState.getCurrentContent();
            let selection = editorState.getSelection();

            if (!selection.isCollapsed()) {
                selection = selection.merge({
                    anchorOffset: selection.getEndOffset(),
                    focusOffset: selection.getEndOffset(),
                });
            }

            const newContent = Modifier.insertText(currentContent, selection, text);
            const newEditorState = EditorState.push(editorState, newContent, "insert-characters");
            onEditorStateChange(newEditorState);
            return true;
        }
        return false;
    };

    return (
        <>
            <div className="flex justify-center pb-3">
                <CustomCascader
                    options={documentDynamicOptions}
                    setDynamicOptions={setDynamicOptions}
                />
            </div>

            <div
                className={`min-h-[450px] max-h-[500px] overflow-y-auto rounded-lg p-3 border
        ${
        theme === "dark"
            ? "bg-gray-900 border-gray-700 text-white"
            : "bg-white border-gray-300 text-black"
        }`}
            >
                <Editor
                    editorState={editorState}
                    onEditorStateChange={onEditorStateChange}
                    wrapperClassName="wrapper-class"
                    editorClassName={`editor-class min-h-[400px] ${
                        theme === "dark"
                            ? "bg-gray-900 text-white placeholder-gray-400"
                            : "bg-white text-black placeholder-gray-500"
                    }`}
                    toolbarClassName={`toolbar-class border-b mb-2 ${
                        theme === "dark"
                            ? "bg-gray-800 border-gray-700 text-gray-200"
                            : "bg-gray-100 border-gray-300 text-gray-800"
                    }`}
                    handlePastedText={handlePastedText}
                    toolbar={{
                        options: ["inline", "textAlign", "history", "blockType"],
                        blockType: {
                            inDropdown: false,
                            options: ["Normal", "H1", "H2", "H3", "H4", "H5", "H6"],
                        },
                    }}
                />
            </div>
        </>
    );
};

export default RichText;
